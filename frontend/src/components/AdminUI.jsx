"use client";

import { useEffect, useState } from "react";

// Shared admin UI pieces. Only used by the admin pages in this rebuild.
// Dark tokens only. No em dashes in any copy here.

export const inputCls =
  "min-h-11 w-full rounded-xl border border-line bg-raised p-3 text-ink placeholder:text-muted focus:border-battery focus:outline-none";
export const labelCls = "mb-1 block text-sm font-semibold text-ink";
export const cardCls = "rounded-2xl border border-line bg-surface p-5";
export const btnPrimary =
  "press inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-battery px-5 py-2 font-semibold text-canvas hover:bg-battery-deep disabled:opacity-60";
export const btnGhost =
  "press inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-raised px-4 py-2 font-semibold text-ink hover:border-battery disabled:opacity-60";
export const btnDanger =
  "press inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-danger/50 bg-danger/10 px-4 py-2 font-semibold text-danger hover:bg-danger/20 disabled:opacity-60";
export const btnSmall =
  "press inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-line bg-raised px-3 py-2 text-sm font-semibold text-ink hover:border-battery disabled:opacity-60";

export function slugify(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function fmtDate(value) {
  if (!value) return "Not set";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function Notice({ kind, children }) {
  if (!children) return null;
  const cls =
    kind === "error"
      ? "border-danger/50 bg-danger/10 text-danger"
      : "border-success/50 bg-success/10 text-success";
  return (
    <p className={`mb-4 rounded-xl border p-3 text-sm font-medium ${cls}`}>{children}</p>
  );
}

export function Field({ label, hint, error, children, htmlFor }) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className={labelCls}>
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-ink">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[#FF7A1A]"
      />
      <span>
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

// Two step delete: first tap arms it, second tap confirms.
export function DeleteButton({ label, onDelete, busy, confirmLabel }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onDelete();
        } else {
          setArmed(true);
          setTimeout(() => setArmed(false), 4000);
        }
      }}
      className={btnDanger}
    >
      {busy ? "Deleting..." : armed ? confirmLabel || "Tap again to delete" : label || "Delete"}
    </button>
  );
}

// Fetch the public product list once, for pickers. Returns products with
// id, slug, name, pricePKR, brand, model, category, stock.
export function useCatalogProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/products?limit=100")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Could not load products.");
        setProducts(data.products || []);
      })
      .catch((e) => setError(e.message || "Could not load products."))
      .finally(() => setLoading(false));
  }, []);
  return { products, loading, error };
}

// Ordered product picker. value is an array of product ids (or slugs).
// The admin API accepts either. Shows the chosen products in order with
// up, down and remove controls.
export function ProductPicker({ value, onChange, products, label }) {
  const [selected, setSelected] = useState("");
  const byId = new Map();
  (products || []).forEach((p) => {
    byId.set(String(p.id || p._id || p.slug), p);
    byId.set(String(p.slug), p);
  });
  const chosen = (value || []).map((v) => byId.get(String(v))).filter(Boolean);
  const add = () => {
    if (!selected) return;
    if ((value || []).includes(selected)) return;
    onChange([...(value || []), selected]);
    setSelected("");
  };
  const move = (i, dir) => {
    const next = [...(value || [])];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i) => onChange((value || []).filter((_, k) => k !== i));
  return (
    <div>
      {label && <span className={labelCls}>{label}</span>}
      {chosen.length > 0 && (
        <ul className="mb-3 space-y-2">
          {chosen.map((p, i) => (
            <li
              key={String(p.id || p.slug) + i}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                {i + 1}. {p.name}
                {p.pricePKR != null ? `, Rs ${Number(p.pricePKR).toLocaleString("en-PK")}` : ""}
              </span>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="cursor-pointer rounded-lg border border-line px-2 py-1 text-xs font-semibold text-ink disabled:opacity-40" aria-label={`Move ${p.name} up`}>
                Up
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === chosen.length - 1} className="cursor-pointer rounded-lg border border-line px-2 py-1 text-xs font-semibold text-ink disabled:opacity-40" aria-label={`Move ${p.name} down`}>
                Down
              </button>
              <button type="button" onClick={() => remove(i)} className="cursor-pointer rounded-lg border border-danger/50 px-2 py-1 text-xs font-semibold text-danger" aria-label={`Remove ${p.name}`}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {(value || []).length > chosen.length && (
        <p className="mb-2 text-xs text-muted">
          {(value || []).length - chosen.length} chosen product(s) could not be matched to the catalogue list.
        </p>
      )}
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className={inputCls}
          aria-label="Choose a product to add"
        >
          <option value="">Choose a product...</option>
          {(products || []).map((p) => (
            <option key={String(p.id || p.slug)} value={String(p.id || p.slug)}>
              {p.name}
              {p.pricePKR != null ? `, Rs ${Number(p.pricePKR).toLocaleString("en-PK")}` : ""}
            </option>
          ))}
        </select>
        <button type="button" onClick={add} disabled={!selected} className={btnGhost}>
          Add
        </button>
      </div>
    </div>
  );
}

// Single image upload via /api/upload, with a manual URL fallback.
export function UploadField({ value, onChange, label, hint }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };
  return (
    <div>
      {label && <span className={labelCls}>{label}</span>}
      {value && (
        <div className="mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Current upload" className="h-24 w-24 rounded-xl border border-line object-cover" />
        </div>
      )}
      <label className="mb-2 block cursor-pointer rounded-xl border border-dashed border-line bg-raised p-4 text-center text-sm text-muted hover:border-battery">
        {busy ? "Uploading..." : "Click to upload an image (max 5 MB, JPEG, PNG or WebP only)"}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={busy} />
      </label>
      <div className="flex gap-2">
        <input
          type="url"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          className={inputCls}
          placeholder="Or paste an image URL (https:// or / path, no SVG)"
        />
        <button
          type="button"
          disabled={!manual.trim()}
          onClick={() => {
            const url = manual.trim();
            if (!url.startsWith("/") && !url.startsWith("https://")) {
              setError("Image URLs must start with https:// or a / path.");
              return;
            }
            if (/\.svg(\?|#|$)/i.test(url)) {
              setError("SVG images are not allowed.");
              return;
            }
            setError("");
            onChange(url);
            setManual("");
          }}
          className={btnGhost}
        >
          Use URL
        </button>
      </div>
      {value && (
        <button type="button" onClick={() => onChange("")} className="mt-2 cursor-pointer text-sm font-semibold text-danger">
          Remove image
        </button>
      )}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

export async function apiJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}
