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
  Toggle,
} from "@/components/AdminUI";

const EMPTY = { key: "", label: "", type: "list", source: "brand", specKey: "", active: true, sortOrder: 0 };

const SOURCE_OPTIONS = [
  { value: "brand", label: "Brand" },
  { value: "category", label: "Category" },
  { value: "price", label: "Price" },
  { value: "availability", label: "Availability (in stock)" },
  { value: "rating", label: "Rating" },
  { value: "spec", label: "A product spec (choose the spec key below)" },
];

export default function FiltersPage() {
  const [filters, setFilters] = useState(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState("");

  const load = () => {
    setError("");
    setNotConfigured(false);
    fetch("/api/admin/filters")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          if (data.code === "db_not_configured") setNotConfigured(true);
          else setError(data.error || "Could not load filters.");
          setFilters([]);
          return;
        }
        setFilters(data.filters || []);
      })
      .catch(() => {
        setError("Could not load filters. Check your connection.");
        setFilters([]);
      });
  };

  useEffect(load, []);

  const startEdit = (f) => {
    const isSpec = f.source.startsWith("spec:");
    setEditingId(f.id || f.key);
    setForm({
      key: f.key || "",
      label: f.label || "",
      type: f.type || "list",
      source: isSpec ? "spec" : f.source,
      specKey: isSpec ? f.source.slice(5) : "",
      active: f.active !== false,
      sortOrder: f.sortOrder ?? 0,
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

  const sourceValue = () =>
    form.source === "spec" ? `spec:${form.specKey.trim()}` : form.source;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const next = {};
    if (!form.key.trim()) next.key = "Enter a key, e.g. brand.";
    if (!form.label.trim()) next.label = "Enter a label, e.g. Brand.";
    if (form.source === "spec" && !form.specKey.trim()) {
      next.specKey = "Enter the spec key, e.g. Capacity.";
    }
    if (Object.keys(next).length > 0) {
      setFormErrors(next);
      return;
    }
    const payload = {
      key: form.key.trim(),
      label: form.label.trim(),
      type: form.type,
      source: sourceValue(),
      active: form.active,
      sortOrder: Number(form.sortOrder) || 0,
    };
    setBusy(true);
    try {
      if (editingId) {
        await apiJson(`/api/admin/filters/${encodeURIComponent(editingId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setNotice(`"${payload.label}" was saved.`);
      } else {
        await apiJson("/api/admin/filters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setNotice(`"${payload.label}" was added.`);
      }
      startNew();
      load();
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (f) => {
    setDeleting(f.id || f.key);
    setError("");
    setNotice("");
    try {
      await apiJson(`/api/admin/filters/${encodeURIComponent(f.id || f.key)}`, {
        method: "DELETE",
      });
      setNotice(`"${f.label}" was deleted.`);
      if (editingId === (f.id || f.key)) startNew();
      load();
    } catch (err) {
      setError(err.message || "Delete failed.");
    } finally {
      setDeleting("");
    }
  };

  if (!filters) return <p className="p-4 text-muted">Loading...</p>;

  const sorted = [...filters].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-2 font-display text-2xl font-bold text-ink">Filters</h2>
      <p className="mb-6 text-sm text-muted">
        Filters on the shop collection pages. Values are derived from the
        products themselves: distinct brands, distinct spec values, the real
        lowest and highest price. The admin never types filter values by hand.
        Here you enable, order and label the filters.
      </p>
      {notConfigured && (
        <div className={`${cardCls} mb-4 text-center`}>
          <p className="mb-2 font-display text-lg font-semibold text-ink">Database not connected</p>
          <p className="text-sm text-muted">Set MONGODB_URI to manage filters here.</p>
        </div>
      )}
      <Notice kind="error">{error}</Notice>
      <Notice kind="success">{notice}</Notice>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cardCls}>
          <h3 className="mb-4 font-display text-xl font-semibold text-ink">
            {editingId ? "Edit filter" : "Add a filter"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Key *" error={formErrors.key} hint="A short stable id, e.g. brand, price, capacity.">
              <input
                value={form.key}
                onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") }))}
                className={inputCls}
                placeholder="e.g. brand"
              />
            </Field>
            <Field label="Label *" error={formErrors.label} hint="What the customer sees, e.g. Brand.">
              <input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className={inputCls}
                placeholder="e.g. Brand"
              />
            </Field>
            <Field label="Type">
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className={inputCls}
              >
                <option value="list">List (pick one or more values)</option>
                <option value="range">Range (lowest to highest, for price)</option>
                <option value="boolean">Yes or no (for availability)</option>
              </select>
            </Field>
            <Field label="Source">
              <select
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                className={inputCls}
              >
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            {form.source === "spec" && (
              <Field label="Spec key *" error={formErrors.specKey} hint="The exact spec label from the product form, e.g. Capacity or Bluetooth version.">
                <input
                  value={form.specKey}
                  onChange={(e) => setForm((f) => ({ ...f, specKey: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. Capacity"
                />
              </Field>
            )}
            <Field label="Sort order" hint="Lower numbers show first on the shop.">
              <input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Toggle
              checked={form.active}
              onChange={(v) => setForm((f) => ({ ...f, active: v }))}
              label="Active"
              hint="Inactive filters are hidden from the shop."
            />
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={busy} className={btnPrimary}>
                {busy ? "Saving..." : editingId ? "Save changes" : "Add filter"}
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
            All filters ({filters.length})
          </h3>
          {filters.length === 0 ? (
            <p className="text-sm text-muted">No filters yet. Add the first one.</p>
          ) : (
            <ul className="space-y-3">
              {sorted.map((f) => (
                <li key={f.id || f.key} className="flex items-center gap-3 rounded-xl border border-line bg-raised p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">
                      {f.label}
                      {f.active === false && <span className="ml-2 text-xs text-muted">(hidden)</span>}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {f.key} · {f.type} · {f.source} · order {f.sortOrder ?? 0}
                    </p>
                  </div>
                  <button type="button" onClick={() => startEdit(f)} className="min-h-11 shrink-0 cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-battery">
                    Edit
                  </button>
                  <DeleteButton
                    label="Delete"
                    busy={deleting === (f.id || f.key)}
                    onDelete={() => handleDelete(f)}
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
