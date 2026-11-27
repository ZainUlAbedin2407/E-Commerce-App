"use client";

import { useEffect, useState } from "react";
import {
  apiJson,
  btnGhost,
  btnPrimary,
  cardCls,
  DeleteButton,
  Field,
  inputCls,
  Notice,
  ProductPicker,
  slugify,
  Toggle,
  UploadField,
  useCatalogProducts,
} from "@/components/AdminUI";

const EMPTY = {
  name: "",
  slug: "",
  blurb: "",
  image: "",
  type: "manual",
  products: [],
  ruleKind: "",
  ruleBrand: "",
  ruleTag: "",
  ruleWindowDays: 30,
  ruleLimit: 24,
  seoTitle: "",
  seoDescription: "",
  sortOrder: 0,
  active: true,
};

const RULE_KINDS = [
  { value: "", label: "No rule (pick products by hand)" },
  { value: "category", label: "Category" },
  { value: "brand", label: "Brand" },
  { value: "tag", label: "Tag" },
  { value: "onSale", label: "On sale (compare-at price above price)" },
  { value: "new", label: "New (added recently)" },
];

export default function CollectionsPage() {
  const [collections, setCollections] = useState(null);
  const [brands, setBrands] = useState([]);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState("");
  const { products } = useCatalogProducts();

  const load = () => {
    setError("");
    setNotConfigured(false);
    fetch("/api/admin/collections")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          if (data.code === "db_not_configured") setNotConfigured(true);
          else setError(data.error || "Could not load collections.");
          setCollections([]);
          return;
        }
        setCollections(data.collections || []);
      })
      .catch(() => {
        setError("Could not load collections. Check your connection.");
        setCollections([]);
      });
  };

  useEffect(load, []);
  useEffect(() => {
    fetch("/api/admin/brands")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.brands) setBrands(data.brands);
      })
      .catch(() => {});
  }, []);

  const startEdit = (c) => {
    setEditingId(c.id || c.slug);
    setForm({
      name: c.name || "",
      slug: c.slug || "",
      blurb: c.blurb || "",
      image: c.image || "",
      type: c.type || "manual",
      products: (c.products || []).map((p) => String(p)),
      ruleKind: c.rule?.kind || "",
      ruleBrand: c.rule?.brand || "",
      ruleTag: c.rule?.tag || "",
      ruleWindowDays: c.rule?.windowDays ?? 30,
      ruleLimit: c.rule?.limit ?? 24,
      seoTitle: c.seoTitle || "",
      seoDescription: c.seoDescription || "",
      sortOrder: c.sortOrder ?? 0,
      active: c.active !== false,
    });
    setFormErrors({});
    setNotice("");
  };

  const startNew = () => {
    setEditingId("");
    setForm(EMPTY);
    setFormErrors({});
    setNotice("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const next = {};
    if (!form.name.trim()) next.name = "Enter the collection name.";
    const slug = form.slug.trim() || slugify(form.name);
    if (!slug) next.slug = "Enter a URL slug.";
    if (form.type === "manual" && form.products.length === 0) {
      next.products = "Pick at least one product, or switch to a rule.";
    }
    if (form.type === "rule" && !form.ruleKind) {
      next.ruleKind = "Choose what the rule matches.";
    }
    if (form.type === "rule" && form.ruleKind === "brand" && !form.ruleBrand) {
      next.ruleBrand = "Choose a brand for the rule.";
    }
    if (form.type === "rule" && form.ruleKind === "tag" && !form.ruleTag.trim()) {
      next.ruleTag = "Enter a tag for the rule.";
    }
    if (Object.keys(next).length > 0) {
      setFormErrors(next);
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug,
      blurb: form.blurb.trim(),
      image: form.image.trim(),
      type: form.type,
      products: form.type === "manual" ? form.products : [],
      rule:
        form.type === "rule"
          ? {
              kind: form.ruleKind,
              brand: form.ruleBrand,
              tag: form.ruleKind === "tag" ? form.ruleTag.trim() : "",
              windowDays: Number(form.ruleWindowDays) || 30,
              limit: Number(form.ruleLimit) || 24,
            }
          : {},
      seoTitle: form.seoTitle.trim(),
      seoDescription: form.seoDescription.trim(),
      sortOrder: Number(form.sortOrder) || 0,
      active: form.active,
    };
    setBusy(true);
    try {
      if (editingId) {
        await apiJson(`/api/admin/collections/${encodeURIComponent(editingId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setNotice(`"${payload.name}" was saved.`);
      } else {
        await apiJson("/api/admin/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setNotice(`"${payload.name}" was added.`);
      }
      startNew();
      load();
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (c) => {
    setDeleting(c.id || c.slug);
    setError("");
    setNotice("");
    try {
      await apiJson(`/api/admin/collections/${encodeURIComponent(c.id || c.slug)}`, {
        method: "DELETE",
      });
      setNotice(`"${c.name}" was deleted.`);
      if (editingId === (c.id || c.slug)) startNew();
      load();
    } catch (err) {
      setError(err.message || "Delete failed.");
    } finally {
      setDeleting("");
    }
  };

  if (!collections) return <p className="p-4 text-muted">Loading...</p>;

  const sorted = [...collections].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-2 font-display text-2xl font-bold text-ink">Collections</h2>
      <p className="mb-6 text-sm text-muted">
        Collections are the shop categories and curated groups. A collection is
        either a hand-picked ordered list of products, or a rule that fills
        itself, for example all products of one brand or everything on sale.
      </p>
      {notConfigured && (
        <div className={`${cardCls} mb-4 text-center`}>
          <p className="mb-2 font-display text-lg font-semibold text-ink">Database not connected</p>
          <p className="text-sm text-muted">Set MONGODB_URI to manage collections here.</p>
        </div>
      )}
      <Notice kind="error">{error}</Notice>
      <Notice kind="success">{notice}</Notice>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cardCls}>
          <h3 className="mb-4 font-display text-xl font-semibold text-ink">
            {editingId ? "Edit collection" : "Add a collection"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Name *" error={formErrors.name}>
              <input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: f.slug === slugify(f.name) || f.slug === "" ? slugify(name) : f.slug,
                  }));
                }}
                className={inputCls}
                placeholder="e.g. Earbuds"
              />
            </Field>
            <Field label="URL slug *" error={formErrors.slug} hint="Made from the name automatically.">
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                className={inputCls}
                placeholder="e.g. earbuds"
              />
            </Field>
            <Field label="Short description">
              <textarea
                rows={2}
                value={form.blurb}
                onChange={(e) => setForm((f) => ({ ...f, blurb: e.target.value }))}
                className={inputCls}
                placeholder="One or two lines shown on the collection page."
              />
            </Field>
            <UploadField
              label="Collection image"
              value={form.image}
              onChange={(url) => setForm((f) => ({ ...f, image: url }))}
            />
            <Field label="Type">
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className={inputCls}
              >
                <option value="manual">Manual (hand-picked products)</option>
                <option value="rule">Rule (fills itself from products)</option>
              </select>
            </Field>
            {form.type === "manual" ? (
              <div>
                <ProductPicker
                  label="Products in order"
                  value={form.products}
                  onChange={(v) => setForm((f) => ({ ...f, products: v }))}
                  products={products}
                />
                {formErrors.products && (
                  <p className="mt-1 text-xs font-medium text-danger">{formErrors.products}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Field label="Rule matches" error={formErrors.ruleKind}>
                  <select
                    value={form.ruleKind}
                    onChange={(e) => setForm((f) => ({ ...f, ruleKind: e.target.value }))}
                    className={inputCls}
                  >
                    {RULE_KINDS.map((k) => (
                      <option key={k.value} value={k.value}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </Field>
                {form.ruleKind === "category" && (
                  <p className="rounded-xl border border-line bg-raised p-3 text-sm text-muted">
                    The rule matches products in the category with the same
                    slug as this collection. Name the collection slug exactly
                    like the category, for example earbuds, speakers or
                    power-banks.
                  </p>
                )}
                {form.ruleKind === "brand" && (
                  <Field label="Brand *" error={formErrors.ruleBrand}>
                    <select
                      value={form.ruleBrand}
                      onChange={(e) => setForm((f) => ({ ...f, ruleBrand: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="">Choose a brand...</option>
                      {brands.map((b) => (
                        <option key={b.id || b.slug} value={b.slug}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                {form.ruleKind === "tag" && (
                  <Field label="Tag *" error={formErrors.ruleTag}>
                    <input
                      value={form.ruleTag}
                      onChange={(e) => setForm((f) => ({ ...f, ruleTag: e.target.value }))}
                      className={inputCls}
                      placeholder="e.g. bestseller"
                    />
                  </Field>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Window (days)" hint="For new products: added in the last so many days.">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={form.ruleWindowDays}
                      onChange={(e) => setForm((f) => ({ ...f, ruleWindowDays: e.target.value }))}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Limit" hint="Most products the rule can include.">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={form.ruleLimit}
                      onChange={(e) => setForm((f) => ({ ...f, ruleLimit: e.target.value }))}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SEO title (optional)">
                <input
                  value={form.seoTitle}
                  onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. Earbuds in Karachi"
                  maxLength={200}
                />
              </Field>
              <Field label="Sort order" hint="Lower numbers show first.">
                <input
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="SEO description (optional)">
              <textarea
                rows={2}
                value={form.seoDescription}
                onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
                className={inputCls}
                placeholder="Short summary for search results."
                maxLength={500}
              />
            </Field>
            <Toggle
              checked={form.active}
              onChange={(v) => setForm((f) => ({ ...f, active: v }))}
              label="Active"
              hint="Inactive collections are hidden from the shop."
            />
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={busy} className={btnPrimary}>
                {busy ? "Saving..." : editingId ? "Save changes" : "Add collection"}
              </button>
              {editingId && (
                <button type="button" onClick={startNew} className={btnGhost}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </div>

        <div className={cardCls}>
          <h3 className="mb-4 font-display text-xl font-semibold text-ink">
            All collections ({collections.length})
          </h3>
          {collections.length === 0 ? (
            <p className="text-sm text-muted">No collections yet. Add the first one.</p>
          ) : (
            <ul className="space-y-3">
              {sorted.map((c) => (
                <li key={c.id || c.slug} className="flex items-center gap-3 rounded-xl border border-line bg-raised p-3">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-line object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas font-display text-lg font-bold text-battery">
                      {(c.name || "?").slice(0, 1)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">
                      {c.name}
                      {c.active === false && <span className="ml-2 text-xs text-muted">(hidden)</span>}
                    </p>
                    <p className="truncate text-xs text-muted">
                      /collections/{c.slug} · {c.type === "rule" ? `rule: ${c.rule?.kind || "none"}` : `${(c.products || []).length} products picked`} · order {c.sortOrder ?? 0}
                    </p>
                  </div>
                  <button type="button" onClick={() => startEdit(c)} className="min-h-11 shrink-0 cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-battery">
                    Edit
                  </button>
                  <DeleteButton
                    label="Delete"
                    busy={deleting === (c.id || c.slug)}
                    onDelete={() => handleDelete(c)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
