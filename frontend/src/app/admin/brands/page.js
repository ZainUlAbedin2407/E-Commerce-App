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
  slugify,
  Toggle,
  UploadField,
} from "@/components/AdminUI";

const EMPTY = { name: "", slug: "", logo: "", description: "", active: true };

export default function BrandsPage() {
  const [brands, setBrands] = useState(null);
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
    fetch("/api/admin/brands")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          if (data.code === "db_not_configured") setNotConfigured(true);
          else setError(data.error || "Could not load brands.");
          setBrands([]);
          return;
        }
        setBrands(data.brands || []);
      })
      .catch(() => {
        setError("Could not load brands. Check your connection.");
        setBrands([]);
      });
  };

  useEffect(load, []);

  const startEdit = (b) => {
    setEditingId(b.id || b.slug);
    setForm({
      name: b.name || "",
      slug: b.slug || "",
      logo: b.logo || "",
      description: b.description || "",
      active: b.active !== false,
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
    if (!form.name.trim()) next.name = "Enter the brand name.";
    const slug = form.slug.trim() || slugify(form.name);
    if (!slug) next.slug = "Enter a URL slug.";
    if (Object.keys(next).length > 0) {
      setFormErrors(next);
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug,
      logo: form.logo.trim(),
      description: form.description.trim(),
      active: form.active,
    };
    setBusy(true);
    try {
      if (editingId) {
        await apiJson(`/api/admin/brands/${encodeURIComponent(editingId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setNotice(`"${payload.name}" was saved.`);
      } else {
        await apiJson("/api/admin/brands", {
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

  const handleDelete = async (b) => {
    setDeleting(b.id || b.slug);
    setError("");
    setNotice("");
    try {
      await apiJson(`/api/admin/brands/${encodeURIComponent(b.id || b.slug)}`, {
        method: "DELETE",
      });
      setNotice(`"${b.name}" was deleted.`);
      if (editingId === (b.id || b.slug)) startNew();
      load();
    } catch (err) {
      setError(err.message || "Delete failed.");
    } finally {
      setDeleting("");
    }
  };

  if (!brands) return <p className="p-4 text-muted">Loading...</p>;

  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-2 font-display text-2xl font-bold text-ink">Brands</h2>
      <p className="mb-6 text-sm text-muted">
        Brands power the brand pages and the brand filter. Products link to a
        brand here, never to free text, so one brand cannot split into three.
      </p>
      {notConfigured && (
        <div className={`${cardCls} mb-4 text-center`}>
          <p className="mb-2 font-display text-lg font-semibold text-ink">Database not connected</p>
          <p className="text-sm text-muted">Set MONGODB_URI to manage brands here.</p>
        </div>
      )}
      <Notice kind="error">{error}</Notice>
      <Notice kind="success">{notice}</Notice>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cardCls}>
          <h3 className="mb-4 font-display text-xl font-semibold text-ink">
            {editingId ? "Edit brand" : "Add a brand"}
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
                placeholder="e.g. OMXMO"
              />
            </Field>
            <Field label="URL slug *" error={formErrors.slug} hint="Made from the name automatically. Edit it only if you need a different URL.">
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                className={inputCls}
                placeholder="e.g. omxmo"
              />
            </Field>
            <UploadField
              label="Logo"
              value={form.logo}
              onChange={(url) => setForm((f) => ({ ...f, logo: url }))}
              hint="Shown on the brand page. Leave empty when a brand has no logo."
            />
            <Field label="Description">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={inputCls}
                placeholder="One or two lines about the brand."
              />
            </Field>
            <Toggle
              checked={form.active}
              onChange={(v) => setForm((f) => ({ ...f, active: v }))}
              label="Active"
              hint="Inactive brands are hidden from the shop."
            />
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={busy} className={btnPrimary}>
                {busy ? "Saving..." : editingId ? "Save changes" : "Add brand"}
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
            All brands ({brands.length})
          </h3>
          {brands.length === 0 ? (
            <p className="text-sm text-muted">No brands yet. Add the first one.</p>
          ) : (
            <ul className="space-y-3">
              {brands.map((b) => (
                <li key={b.id || b.slug} className="flex items-center gap-3 rounded-xl border border-line bg-raised p-3">
                  {b.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logo} alt={`${b.name} logo`} className="h-12 w-12 shrink-0 rounded-lg border border-line bg-canvas object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas font-display text-lg font-bold text-battery">
                      {(b.name || "?").slice(0, 1)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">
                      {b.name}
                      {b.active === false && <span className="ml-2 text-xs text-muted">(hidden)</span>}
                    </p>
                    <p className="truncate text-xs text-muted">
                      /brands/{b.slug} · {b.productCount ?? 0} product{(b.productCount ?? 0) === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button type="button" onClick={() => startEdit(b)} className="min-h-11 shrink-0 cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-battery">
                    Edit
                  </button>
                  <DeleteButton
                    label="Delete"
                    busy={deleting === (b.id || b.slug)}
                    onDelete={() => handleDelete(b)}
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
