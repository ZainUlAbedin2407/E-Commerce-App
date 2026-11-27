"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/products";
import {
  apiJson,
  btnGhost,
  btnPrimary,
  btnSmall,
  cardCls,
  DeleteButton,
  Field,
  fmtDate,
  inputCls,
  Notice,
  ProductPicker,
  toDateInput,
  Toggle,
  useCatalogProducts,
} from "@/components/AdminUI";

const SECTION_TYPES = [
  { value: "hero", label: "Hero (one product, one line, one button)" },
  { value: "banner", label: "Banner (a strip with products)" },
  { value: "categoryTiles", label: "Category tiles" },
  { value: "productRow", label: "Product row (e.g. New Arrivals, Best Sellers)" },
  { value: "brandsStrip", label: "Brands strip" },
  { value: "trustBadges", label: "Trust badges" },
  { value: "reviewsTeaser", label: "Reviews teaser" },
];

const RULE_KINDS = [
  { value: "new", label: "New (added recently, or flagged New arrival)" },
  { value: "bestSelling", label: "Best selling (most units sold)" },
  { value: "category", label: "Category" },
  { value: "onSale", label: "On sale (compare-at price above price)" },
  { value: "tag", label: "Tag (matches a word in specs or features)" },
];

function typeLabel(type) {
  return SECTION_TYPES.find((t) => t.value === type)?.label || type;
}

export default function StorefrontPage() {
  const [sections, setSections] = useState(null);
  const [settings, setSettings] = useState(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [newType, setNewType] = useState("productRow");
  const [newTitle, setNewTitle] = useState("");
  const [ann, setAnn] = useState({ text: "", link: "", active: false, startDate: "", endDate: "" });
  const [annBusy, setAnnBusy] = useState(false);
  const { products } = useCatalogProducts();

  const loadSections = () => {
    fetch("/api/admin/sections")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          if (data.code === "db_not_configured") setNotConfigured(true);
          else setError(data.error || "Could not load homepage sections.");
          setSections([]);
          return;
        }
        setSections(data.sections || []);
      })
      .catch(() => {
        setError("Could not load homepage sections. Check your connection.");
        setSections([]);
      });
  };

  const loadSettings = () => {
    fetch("/api/admin/settings")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) return;
        const s = data.settings || {};
        setSettings(s);
        const a = s.announcement || {};
        setAnn({
          text: a.text || "",
          link: a.link || "",
          active: !!a.active,
          startDate: toDateInput(a.startDate),
          endDate: toDateInput(a.endDate),
        });
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadSections();
    loadSettings();
  }, []);

  const updateLocal = (id, patch) => {
    setSections((list) => list.map((s) => ((s.id || s._id) === id ? { ...s, ...patch } : s)));
  };

  const saveSection = async (section, patch) => {
    const id = section.id || section._id;
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      const data = await apiJson(`/api/admin/sections/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (data.section) {
        setSections((list) => list.map((s) => ((s.id || s._id) === id ? data.section : s)));
      }
      setNotice(`"${section.title || typeLabel(section.type)}" was saved.`);
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setBusyId("");
    }
  };

  const move = async (index, dir) => {
    const sorted = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const j = index + dir;
    if (j < 0 || j >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[j];
    const orderA = a.order ?? index;
    const orderB = b.order ?? j;
    updateLocal(a.id || a._id, { order: orderB });
    updateLocal(b.id || b._id, { order: orderA });
    setError("");
    try {
      await apiJson(`/api/admin/sections/${encodeURIComponent(a.id || a._id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderB }),
      });
      await apiJson(`/api/admin/sections/${encodeURIComponent(b.id || b._id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderA }),
      });
      setNotice("Section order was saved.");
    } catch (err) {
      setError(err.message || "Reorder failed. Reload the page to see the saved order.");
      loadSections();
    }
  };

  const addSection = async () => {
    setError("");
    setNotice("");
    const order = sections.length ? Math.max(...sections.map((s) => s.order ?? 0)) + 1 : 0;
    try {
      const data = await apiJson("/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newType,
          title: newTitle.trim(),
          visible: true,
          order,
          sourceType: "manual",
          productIds: [],
          rule: { kind: "new", category: "", tag: "", windowDays: 30, limit: 8 },
        }),
      });
      setSections((list) => [...list, data.section]);
      setNewTitle("");
      setNotice("Section was added. Edit it below.");
    } catch (err) {
      setError(err.message || "Could not add the section.");
    }
  };

  const deleteSection = async (section) => {
    const id = section.id || section._id;
    setDeletingId(id);
    setError("");
    setNotice("");
    try {
      await apiJson(`/api/admin/sections/${encodeURIComponent(id)}`, { method: "DELETE" });
      setSections((list) => list.filter((s) => (s.id || s._id) !== id));
      setNotice(`"${section.title || typeLabel(section.type)}" was deleted.`);
    } catch (err) {
      setError(err.message || "Delete failed.");
    } finally {
      setDeletingId("");
    }
  };

  const saveAnnouncement = async (e) => {
    e.preventDefault();
    setAnnBusy(true);
    setError("");
    setNotice("");
    try {
      await apiJson("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcement: {
            text: ann.text.trim(),
            link: ann.link.trim(),
            active: ann.active,
            startDate: ann.startDate ? new Date(ann.startDate).toISOString() : null,
            endDate: ann.endDate ? new Date(ann.endDate).toISOString() : null,
          },
        }),
      });
      setNotice("Announcement bar was saved.");
    } catch (err) {
      setError(err.message || "Could not save the announcement.");
    } finally {
      setAnnBusy(false);
    }
  };

  if (!sections) return <p className="p-4 text-muted">Loading...</p>;

  const sorted = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-2 font-display text-2xl font-bold text-ink">Storefront</h2>
      <p className="mb-6 text-sm text-muted">
        The homepage, section by section, in the order customers see them.
        Change New Arrivals and Best Sellers here, with no code. A product row
        either lists products you pick by hand, in your order, or follows a
        rule that fills itself.
      </p>
      {notConfigured && (
        <div className={`${cardCls} mb-4 text-center`}>
          <p className="mb-2 font-display text-lg font-semibold text-ink">Database not connected</p>
          <p className="text-sm text-muted">Set MONGODB_URI to edit the storefront here.</p>
        </div>
      )}
      <Notice kind="error">{error}</Notice>
      <Notice kind="success">{notice}</Notice>

      <div className={`${cardCls} mb-6`}>
        <h3 className="mb-4 font-display text-xl font-semibold text-ink">Add a section</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <label htmlFor="newType" className="mb-1 block text-sm font-semibold text-ink">Type</label>
            <select id="newType" value={newType} onChange={(e) => setNewType(e.target.value)} className={inputCls}>
              {SECTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="min-w-56 flex-1">
            <label htmlFor="newTitle" className="mb-1 block text-sm font-semibold text-ink">Title</label>
            <input
              id="newTitle"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className={inputCls}
              placeholder="e.g. New Arrivals"
            />
          </div>
          <button type="button" onClick={addSection} className={btnPrimary}>
            Add section
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="mb-6 text-sm text-muted">No homepage sections yet. Add the first one above.</p>
      ) : (
        <div className="mb-8 space-y-4">
          {sorted.map((section, index) => {
            const id = section.id || section._id;
            const rule = section.rule || {};
            const isRow = section.type === "productRow" || section.type === "hero" || section.type === "banner";
            return (
              <section key={id} className={cardCls} aria-label={section.title || typeLabel(section.type)}>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink">
                      {section.title || typeLabel(section.type)}
                    </h3>
                    <p className="text-sm text-muted">
                      {typeLabel(section.type)} · Order {section.order ?? index}
                      {section.visible === false ? " · Hidden from the shop" : " · Visible"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className={btnSmall} aria-label="Move section up">
                      Move up
                    </button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === sorted.length - 1} className={btnSmall} aria-label="Move section down">
                      Move down
                    </button>
                    <DeleteButton
                      label="Delete"
                      busy={deletingId === id}
                      onDelete={() => deleteSection(section)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Title">
                    <input
                      value={section.title || ""}
                      onChange={(e) => updateLocal(id, { title: e.target.value })}
                      onBlur={() => saveSection(section, { title: section.title || "" })}
                      className={inputCls}
                      placeholder="e.g. New Arrivals"
                    />
                  </Field>
                  <div className="flex items-end pb-1">
                    <Toggle
                      checked={section.visible !== false}
                      onChange={(v) => {
                        updateLocal(id, { visible: v });
                        saveSection(section, { visible: v });
                      }}
                      label="Visible on the homepage"
                    />
                  </div>
                </div>

                {isRow && (
                  <div className="mt-4 space-y-4">
                    <Field label="Source">
                      <select
                        value={section.sourceType || "manual"}
                        onChange={(e) => {
                          updateLocal(id, { sourceType: e.target.value });
                          saveSection(section, { sourceType: e.target.value });
                        }}
                        className={inputCls}
                      >
                        <option value="manual">Hand-picked products, in my order</option>
                        <option value="rule">Rule (fills itself)</option>
                      </select>
                    </Field>
                    {section.sourceType === "rule" ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Rule matches">
                          <select
                            value={rule.kind || "new"}
                            onChange={(e) => {
                              const nextRule = { ...rule, kind: e.target.value };
                              updateLocal(id, { rule: nextRule });
                              saveSection(section, { rule: nextRule });
                            }}
                            className={inputCls}
                          >
                            {RULE_KINDS.map((k) => (
                              <option key={k.value} value={k.value}>{k.label}</option>
                            ))}
                          </select>
                        </Field>
                        {rule.kind === "category" && (
                          <Field label="Category">
                            <select
                              value={rule.category || ""}
                              onChange={(e) => {
                                const nextRule = { ...rule, category: e.target.value };
                                updateLocal(id, { rule: nextRule });
                                saveSection(section, { rule: nextRule });
                              }}
                              className={inputCls}
                            >
                              <option value="">Choose a category...</option>
                              {CATEGORIES.map((c) => (
                                <option key={c.slug} value={c.slug}>{c.name}</option>
                              ))}
                            </select>
                          </Field>
                        )}
                        {rule.kind === "tag" && (
                          <Field label="Tag" hint="A word in the product specs or features, e.g. wireless.">
                            <input
                              value={rule.tag || ""}
                              onChange={(e) => updateLocal(id, { rule: { ...rule, tag: e.target.value } })}
                              onBlur={() => saveSection(section, { rule })}
                              className={inputCls}
                              placeholder="e.g. wireless"
                            />
                          </Field>
                        )}
                        <Field label="Window (days)" hint="For new and best selling: only the last so many days.">
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={rule.windowDays ?? 30}
                            onChange={(e) => updateLocal(id, { rule: { ...rule, windowDays: Number(e.target.value) || 30 } })}
                            onBlur={() => saveSection(section, { rule })}
                            className={inputCls}
                          />
                        </Field>
                        <Field label="Limit" hint="Most products the row can show.">
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={rule.limit ?? 8}
                            onChange={(e) => updateLocal(id, { rule: { ...rule, limit: Number(e.target.value) || 8 } })}
                            onBlur={() => saveSection(section, { rule })}
                            className={inputCls}
                          />
                        </Field>
                      </div>
                    ) : (
                      <ProductPicker
                        label="Products in order"
                        value={(section.productIds || []).map((p) => String(p))}
                        onChange={(v) => {
                          updateLocal(id, { productIds: v });
                          saveSection(section, { productIds: v });
                        }}
                        products={products}
                      />
                    )}
                    {section.type === "hero" && (
                      <p className="text-xs text-muted">
                        The hero shows the first product in the list, with the
                        title above as its line.
                      </p>
                    )}
                  </div>
                )}
                {busyId === id && <p className="mt-3 text-xs text-muted">Saving...</p>}
              </section>
            );
          })}
        </div>
      )}

      <div className={cardCls}>
        <h3 className="mb-1 font-display text-xl font-semibold text-ink">Announcement bar</h3>
        <p className="mb-4 text-sm text-muted">
          The strip above the header. Leave the text empty to hide it. Dates
          are optional; outside the dates the bar stays hidden.
          {settings?.announcement?.startDate || settings?.announcement?.endDate
            ? ` Currently set from ${fmtDate(settings.announcement.startDate)} to ${fmtDate(settings.announcement.endDate)}.`
            : ""}
        </p>
        <form onSubmit={saveAnnouncement} className="space-y-4">
          <Field label="Text">
            <input
              value={ann.text}
              onChange={(e) => setAnn((a) => ({ ...a, text: e.target.value }))}
              className={inputCls}
              placeholder="e.g. Free delivery in Karachi on orders over Rs 5,000"
              maxLength={300}
            />
          </Field>
          <Field label="Link (optional)" hint="Where the bar takes the customer when tapped. Leave empty for no link.">
            <input
              value={ann.link}
              onChange={(e) => setAnn((a) => ({ ...a, link: e.target.value }))}
              className={inputCls}
              placeholder="e.g. /collections/all"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date (optional)">
              <input
                type="datetime-local"
                value={ann.startDate}
                onChange={(e) => setAnn((a) => ({ ...a, startDate: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="End date (optional)">
              <input
                type="datetime-local"
                value={ann.endDate}
                onChange={(e) => setAnn((a) => ({ ...a, endDate: e.target.value }))}
                className={inputCls}
              />
            </Field>
          </div>
          <Toggle
            checked={ann.active}
            onChange={(v) => setAnn((a) => ({ ...a, active: v }))}
            label="Show the announcement bar"
          />
          <button type="submit" disabled={annBusy} className={btnPrimary}>
            {annBusy ? "Saving..." : "Save announcement"}
          </button>
        </form>
      </div>
    </div>
  );
}
