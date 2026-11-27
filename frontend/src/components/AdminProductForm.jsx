"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/products";
import { btnGhost, btnPrimary, Field, inputCls, labelCls, Notice, Toggle } from "@/components/AdminUI";

const EMPTY = {
  name: "",
  brand: "",
  brandId: "",
  model: "",
  category: "speakers",
  pricePKR: "",
  compareAtPricePKR: "",
  stock: "",
  trackStock: false,
  lowStockThreshold: "",
  warrantyMonths: 0,
  weightKg: "",
  shortDesc: "",
  specs: [],
  featuresText: "",
  images: [],
  isFeatured: false,
  isNew: false,
  active: true,
  seoTitle: "",
  seoDescription: "",
};

// Image URLs: https:// (Cloudinary uploads) or a / path (seed images).
// SVG is rejected. An SVG can carry scripts and is not a product photo.
// The server validates the same rule in src/lib/validation.js.
function isValidImageUrl(url) {
  if (url.startsWith("/")) return !/\.svg(\?|#|$)/i.test(url);
  if (url.startsWith("https://")) return !/\.svg(\?|#|$)/i.test(url);
  return false;
}

// Shared add/edit form. `initial` is the existing product for edits (null
// for a new product). `onSave` receives the payload and must return a
// promise; the form only navigates after it resolves.
export default function AdminProductForm({ initial, onSave }) {
  const router = useRouter();
  const [categories, setCategories] = useState(CATEGORIES);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(() => {
    if (!initial) return EMPTY;
    const specsObj = initial.specs || {};
    return {
      name: initial.name || "",
      brand: initial.brand || "",
      brandId: initial.brandId ? String(initial.brandId) : "",
      model: initial.model || "",
      category: initial.category || "speakers",
      pricePKR: initial.pricePKR != null ? String(initial.pricePKR) : "",
      compareAtPricePKR:
        initial.compareAtPricePKR != null ? String(initial.compareAtPricePKR) : "",
      stock: initial.stock != null ? String(initial.stock) : "",
      trackStock: initial.stock != null,
      lowStockThreshold:
        initial.lowStockThreshold != null ? String(initial.lowStockThreshold) : "",
      warrantyMonths: initial.warrantyMonths ?? 0,
      weightKg: initial.weightKg != null ? String(initial.weightKg) : "",
      shortDesc: initial.shortDesc || "",
      specs: Object.entries(specsObj).map(([k, v]) => ({ key: k, value: String(v) })),
      featuresText: (initial.features || []).join(", "),
      images: initial.images || [],
      isFeatured: !!initial.isFeatured,
      isNew: !!initial.isNew,
      active: initial.active !== false,
      seoTitle: initial.seoTitle || "",
      seoDescription: initial.seoDescription || "",
    };
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadAvailable, setUploadAvailable] = useState(true);
  const [manualUrl, setManualUrl] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.categories?.length) setCategories(data.categories);
      })
      .catch(() => {});
    fetch("/api/admin/brands")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.brands) setBrands(data.brands);
      })
      .catch(() => {});
  }, []);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const setSpec = (i, field, value) => {
    setForm((f) => ({
      ...f,
      specs: f.specs.map((s, k) => (k === i ? { ...s, [field]: value } : s)),
    }));
  };

  const handleBrandSelect = (brandId) => {
    const brand = brands.find((b) => String(b.id || b.slug) === brandId);
    setForm((f) => ({
      ...f,
      brandId: brand ? String(brand.id) : "",
      brand: brand ? brand.name : f.brand,
    }));
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "upload_not_configured") {
          setUploadAvailable(false);
          setError(
            "Photo upload is not configured yet (Cloudinary env vars missing). Paste an image URL below instead, or set up Cloudinary first."
          );
        } else {
          setError(data.error || "Upload failed.");
        }
        return;
      }
      setForm((f) => ({ ...f, images: [...f.images, data.url] }));
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAddManualUrl = () => {
    const url = manualUrl.trim();
    if (!url) return;
    if (!isValidImageUrl(url)) {
      setError("Image URLs must start with https:// (or a / path) and cannot be SVG.");
      return;
    }
    setError("");
    setForm((f) => ({ ...f, images: [...f.images, url] }));
    setManualUrl("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const next = {};
    if (!form.name.trim()) next.name = "Enter the product name.";
    if (!form.brand.trim()) next.brand = "Enter the brand.";
    if (!form.model.trim()) next.model = "Enter the model.";
    const price = form.pricePKR === "" ? null : Number(form.pricePKR);
    if (price == null || Number.isNaN(price) || price <= 0) {
      next.pricePKR = "Enter a real price in PKR. Every product on the shop must carry a price.";
    }
    const compareAt = form.compareAtPricePKR === "" ? null : Number(form.compareAtPricePKR);
    if (compareAt != null && (Number.isNaN(compareAt) || compareAt <= 0)) {
      next.compareAtPricePKR = "Compare-at price must be a number above zero, or leave it empty.";
    }
    if (price != null && compareAt != null && compareAt <= price) {
      next.compareAtPricePKR = "Compare-at price must be higher than the price.";
    }
    const weight = form.weightKg === "" ? null : Number(form.weightKg);
    if (weight != null && (Number.isNaN(weight) || weight < 0)) {
      next.weightKg = "Weight must be a number in kg, or leave it empty.";
    }
    const stock = form.trackStock ? Number(form.stock || 0) : null;
    if (form.trackStock && (Number.isNaN(stock) || stock < 0)) {
      next.stock = "Stock must be zero or more.";
    }
    const lowStock =
      form.lowStockThreshold === "" ? null : Number(form.lowStockThreshold);
    if (lowStock != null && (Number.isNaN(lowStock) || lowStock < 0)) {
      next.lowStockThreshold = "Low stock alert must be zero or more, or leave it empty.";
    }
    const badSpec = form.specs.find((s) => (s.key.trim() || s.value.trim()) && (!s.key.trim() || !s.value.trim()));
    if (badSpec) next.specs = "Every spec row needs both a label and a value, or remove the empty row.";
    if (form.images.length === 0) next.images = "Add at least one product photo.";
    if (Object.keys(next).length > 0) {
      setErrors(next);
      setError("Fix the highlighted fields and save again.");
      return;
    }
    const specs = {};
    form.specs.forEach((s) => {
      if (s.key.trim() && s.value.trim()) specs[s.key.trim()] = s.value.trim();
    });
    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      brandId: form.brandId || null,
      model: form.model.trim(),
      category: form.category,
      pricePKR: price,
      compareAtPricePKR: compareAt,
      stock,
      lowStockThreshold: lowStock,
      warrantyMonths: Number(form.warrantyMonths),
      weightKg: weight,
      shortDesc: form.shortDesc.trim(),
      specs,
      features: form.featuresText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      images: form.images,
      isFeatured: form.isFeatured,
      isNew: form.isNew,
      active: form.active,
      seoTitle: form.seoTitle.trim(),
      seoDescription: form.seoDescription.trim(),
    };
    setBusy(true);
    try {
      await onSave(payload);
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl rounded-2xl border border-line bg-surface p-6">
      <Notice kind="error">{error}</Notice>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Field label="Product name *" error={errors.name}>
          <input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="e.g. OX-PD10 Power Bank" />
        </Field>
        <Field label="Brand *" error={errors.brand} hint="Pick a brand so the brand page and brand filter stay consistent. The brand name is filled in for you.">
          <select
            value={form.brandId}
            onChange={(e) => handleBrandSelect(e.target.value)}
            className={`${inputCls} mb-2`}
            aria-label="Pick a brand"
          >
            <option value="">Pick a brand...</option>
            {brands.map((b) => (
              <option key={b.id || b.slug} value={b.id || b.slug}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            id="brand"
            value={form.brand}
            onChange={(e) => {
              set("brand", e.target.value);
              if (form.brandId) setForm((f) => ({ ...f, brandId: "" }));
            }}
            className={inputCls}
            placeholder="e.g. OMXMO"
          />
        </Field>
        <Field label="Model *" error={errors.model}>
          <input id="model" value={form.model} onChange={(e) => set("model", e.target.value)} className={inputCls} placeholder="e.g. OX-PD10" />
        </Field>
        <Field label="Category *" error={errors.category}>
          <select id="category" value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Field label="Price (PKR) *" error={errors.pricePKR} hint="Every product must carry a real price. There is no price on request on the shop.">
          <input
            id="pricePKR"
            type="number"
            min="1"
            value={form.pricePKR}
            onChange={(e) => set("pricePKR", e.target.value)}
            className={inputCls}
            placeholder="e.g. 3200"
          />
        </Field>
        <Field label="Compare-at price (PKR, optional)" error={errors.compareAtPricePKR} hint="Must be higher than the price. It shows struck through.">
          <input
            id="compareAt"
            type="number"
            min="0"
            value={form.compareAtPricePKR}
            onChange={(e) => set("compareAtPricePKR", e.target.value)}
            className={inputCls}
            placeholder="Old price, for a discount badge"
          />
        </Field>
        <Field label="Stock" error={errors.stock} hint="Untick tracking when stock is not counted for this product. Untracked stock is sent as empty, not zero.">
          <input
            id="stock"
            type="number"
            min="0"
            disabled={!form.trackStock}
            value={form.stock}
            onChange={(e) => set("stock", e.target.value)}
            className={inputCls}
            placeholder="e.g. 25"
          />
          <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={form.trackStock} onChange={(e) => set("trackStock", e.target.checked)} className="h-5 w-5 accent-[#FF7A1A]" />
            Track stock for this product
          </label>
        </Field>
        <Field label="Low stock alert" error={errors.lowStockThreshold} hint="Empty means no alert. When stock falls to this number or below, the product shows in the dashboard low stock list.">
          <input
            id="lowStockThreshold"
            type="number"
            min="0"
            value={form.lowStockThreshold}
            onChange={(e) => set("lowStockThreshold", e.target.value)}
            className={inputCls}
            placeholder="e.g. 5"
          />
        </Field>
        <Field label="Warranty" hint="Most accessories are checking warranty only.">
          <select
            id="warranty"
            value={form.warrantyMonths}
            onChange={(e) => set("warrantyMonths", Number(e.target.value))}
            className={inputCls}
          >
            <option value={0}>Checking warranty only</option>
            <option value={3}>3 months warranty</option>
            <option value={6}>6 months warranty</option>
          </select>
        </Field>
        <Field label="Weight (kg, optional)" error={errors.weightKg} hint="Delivery is Rs 250 (Karachi) / Rs 300 (rest of Pakistan) up to 1 kg, plus Rs 70 per extra kg. The fee is computed from this weight.">
          <input
            id="weight"
            type="number"
            min="0"
            step="0.1"
            value={form.weightKg}
            onChange={(e) => set("weightKg", e.target.value)}
            className={inputCls}
            placeholder="e.g. 0.4"
          />
        </Field>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Toggle checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} label="Featured" hint="Shows in featured rows." />
        <Toggle checked={form.isNew} onChange={(v) => set("isNew", v)} label="New arrival" hint="Shows in New Arrivals." />
        <Toggle checked={form.active} onChange={(v) => set("active", v)} label="Listed (active)" hint="Unlisted products are hidden from the shop." />
      </div>

      <div className="mb-4">
        <Field label="Short description">
          <textarea id="shortDesc" rows={2} value={form.shortDesc} onChange={(e) => set("shortDesc", e.target.value)} className={inputCls} placeholder="One or two lines about the product." />
        </Field>
      </div>

      <div className="mb-4">
        <span className={labelCls}>Specs (structured)</span>
        <p className="mb-2 text-xs text-muted">
          Each row is one spec, for example Capacity and 10000mAh. These keys
          become the spec filters on the shop.
        </p>
        {form.specs.length === 0 && (
          <p className="mb-2 text-sm text-muted">No specs yet. Add the first row below.</p>
        )}
        <div className="space-y-2">
          {form.specs.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={s.key}
                onChange={(e) => setSpec(i, "key", e.target.value)}
                className={inputCls}
                placeholder="Label, e.g. Capacity"
                aria-label={`Spec ${i + 1} label`}
              />
              <input
                value={s.value}
                onChange={(e) => setSpec(i, "value", e.target.value)}
                className={inputCls}
                placeholder="Value, e.g. 10000mAh"
                aria-label={`Spec ${i + 1} value`}
              />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, specs: f.specs.filter((_, k) => k !== i) }))}
                className="min-h-11 shrink-0 cursor-pointer rounded-xl border border-danger/50 px-3 py-2 text-sm font-semibold text-danger"
                aria-label="Remove spec row"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {errors.specs && <p className="mt-1 text-xs font-medium text-danger">{errors.specs}</p>}
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, specs: [...f.specs, { key: "", value: "" }] }))}
          className={`${btnGhost} mt-2`}
        >
          Add spec row
        </button>
      </div>

      <div className="mb-4">
        <Field label="Features (comma separated)">
          <textarea id="features" rows={3} value={form.featuresText} onChange={(e) => set("featuresText", e.target.value)} className={inputCls} placeholder="LCD display, Built-in Type-C cable, Fast charging" />
        </Field>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Field label="SEO title (optional)" hint="Shown in search results. Leave empty to use the product name.">
          <input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className={inputCls} placeholder="e.g. OX-PD10 10000mAh Power Bank" maxLength={200} />
        </Field>
        <Field label="SEO description (optional)" hint="Short summary for search results.">
          <textarea rows={3} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} className={inputCls} placeholder="Short summary for search results." maxLength={500} />
        </Field>
      </div>

      <div className="mb-6">
        <span className={labelCls}>Photos *</span>
        {errors.images && <p className="mt-1 text-xs font-medium text-danger">{errors.images}</p>}
        {form.images.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-3">
            {form.images.map((url, i) => (
              <div key={url + i} className="relative">
                <Image src={url} alt={`Photo ${i + 1}`} width={96} height={96} className="h-24 w-24 rounded-xl border border-line bg-raised object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                  className="absolute -top-2 -right-2 cursor-pointer rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {uploadAvailable ? (
          <label className="mb-2 block cursor-pointer rounded-xl border border-dashed border-line bg-raised p-4 text-center text-sm text-muted hover:border-battery">
            {uploading ? "Uploading..." : "Click to upload a photo (max 5 MB, JPEG, PNG or WebP only)"}
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        ) : (
          <p className="mb-2 text-sm text-muted">
            Photo upload is not configured (Cloudinary not set up). Paste an
            image URL below instead.
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            className={inputCls}
            placeholder="https://.../photo.jpg"
            aria-label="Add image by URL"
          />
          <button type="button" onClick={handleAddManualUrl} className={btnGhost}>
            Add URL
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">
          Image URLs must start with https:// (or a / path) and cannot be SVG.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? "Saving..." : initial ? "Save Changes" : "Add Product"}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} className={btnGhost}>
          Cancel
        </button>
      </div>
    </form>
  );
}
