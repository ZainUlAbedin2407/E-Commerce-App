"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/products";

const EMPTY = {
  name: "",
  brand: "",
  model: "",
  category: "speakers",
  pricePKR: "",
  noPrice: true,
  compareAtPricePKR: "",
  stock: "",
  trackStock: false,
  shortDesc: "",
  specsText: "",
  featuresText: "",
  images: [],
  isFeatured: false,
  isNew: false,
  active: true,
};

function specsFromText(text) {
  const out = {};
  text.split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      if (k && v) out[k] = v;
    }
  });
  return out;
}

function specsToText(specs) {
  if (!specs) return "";
  return Object.entries(specs)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

// Shared add/edit form. `initial` is the existing product for edits (null
// for a new product). `onSave` receives the payload and must return a
// promise; the form only navigates after it resolves.
export default function AdminProductForm({ initial, onSave }) {
  const router = useRouter();
  const [categories, setCategories] = useState(CATEGORIES);
  const [form, setForm] = useState(() => {
    if (!initial) return EMPTY;
    return {
      name: initial.name || "",
      brand: initial.brand || "",
      model: initial.model || "",
      category: initial.category || "speakers",
      pricePKR: initial.pricePKR != null ? String(initial.pricePKR) : "",
      noPrice: initial.pricePKR == null,
      compareAtPricePKR:
        initial.compareAtPricePKR != null ? String(initial.compareAtPricePKR) : "",
      stock: initial.stock != null ? String(initial.stock) : "",
      trackStock: initial.stock != null,
      shortDesc: initial.shortDesc || "",
      specsText: specsToText(initial.specs),
      featuresText: (initial.features || []).join(", "),
      images: initial.images || [],
      isFeatured: !!initial.isFeatured,
      isNew: !!initial.isNew,
      active: initial.active !== false,
    };
  });
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
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

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
      setError("Upload failed — check your connection and try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.brand.trim() || !form.model.trim()) {
      setError("Name, brand and model are required.");
      return;
    }
    if (form.images.length === 0) {
      setError("Add at least one product photo.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      category: form.category,
      pricePKR:
        form.noPrice || form.pricePKR === "" ? null : Number(form.pricePKR),
      compareAtPricePKR:
        form.compareAtPricePKR === "" ? null : Number(form.compareAtPricePKR),
      stock: form.trackStock ? Number(form.stock || 0) : null,
      shortDesc: form.shortDesc.trim(),
      specs: specsFromText(form.specsText),
      features: form.featuresText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      images: form.images,
      isFeatured: form.isFeatured,
      isNew: form.isNew,
      active: form.active,
    };
    if (payload.pricePKR != null && Number.isNaN(payload.pricePKR)) {
      setError("Price must be a number (or leave it empty for WhatsApp for price).");
      return;
    }
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

  const inputCls = "w-full rounded border border-gray-200 p-2";
  const labelCls = "mb-1 block text-sm font-semibold";

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl rounded-lg bg-white p-6 shadow-md">
      {error && (
        <p className="mb-4 rounded bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelCls}>Product name *</label>
          <input id="name" required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="e.g. OX-PD10 Power Bank" />
        </div>
        <div>
          <label htmlFor="brand" className={labelCls}>Brand *</label>
          <input id="brand" required value={form.brand} onChange={(e) => set("brand", e.target.value)} className={inputCls} placeholder="e.g. OMXMO" />
        </div>
        <div>
          <label htmlFor="model" className={labelCls}>Model *</label>
          <input id="model" required value={form.model} onChange={(e) => set("model", e.target.value)} className={inputCls} placeholder="e.g. OX-PD10" />
        </div>
        <div>
          <label htmlFor="category" className={labelCls}>Category *</label>
          <select id="category" value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pricePKR" className={labelCls}>Price (PKR)</label>
          <input
            id="pricePKR"
            type="number"
            min="0"
            disabled={form.noPrice}
            value={form.pricePKR}
            onChange={(e) => set("pricePKR", e.target.value)}
            className={inputCls}
            placeholder="e.g. 3499"
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.noPrice} onChange={(e) => set("noPrice", e.target.checked)} />
            Leave empty — show &ldquo;WhatsApp for price&rdquo;
          </label>
        </div>
        <div>
          <label htmlFor="compareAt" className={labelCls}>Compare-at price (PKR, optional)</label>
          <input
            id="compareAt"
            type="number"
            min="0"
            value={form.compareAtPricePKR}
            onChange={(e) => set("compareAtPricePKR", e.target.value)}
            className={inputCls}
            placeholder="Old price, for a discount badge"
          />
        </div>
        <div>
          <label htmlFor="stock" className={labelCls}>Stock</label>
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
          <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.trackStock} onChange={(e) => set("trackStock", e.target.checked)} />
            Track stock for this product
          </label>
        </div>
        <div className="flex items-end gap-4 pb-1 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} />
            Featured
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isNew} onChange={(e) => set("isNew", e.target.checked)} />
            New arrival
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
            Listed (active)
          </label>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="shortDesc" className={labelCls}>Short description</label>
        <textarea id="shortDesc" rows={2} value={form.shortDesc} onChange={(e) => set("shortDesc", e.target.value)} className={inputCls} placeholder="One or two lines about the product." />
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="specs" className={labelCls}>Specs — one per line, &ldquo;Label: value&rdquo;</label>
          <textarea id="specs" rows={5} value={form.specsText} onChange={(e) => set("specsText", e.target.value)} className={inputCls} placeholder={"Capacity: 10000mAh\nOutput: 22.5W"} />
        </div>
        <div>
          <label htmlFor="features" className={labelCls}>Features — comma separated</label>
          <textarea id="features" rows={5} value={form.featuresText} onChange={(e) => set("featuresText", e.target.value)} className={inputCls} placeholder="LCD display, Built-in Type-C cable, Fast charging" />
        </div>
      </div>

      <div className="mb-6">
        <span className={labelCls}>Photos *</span>
        {form.images.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-3">
            {form.images.map((url, i) => (
              <div key={url + i} className="relative">
                <Image src={url} alt={`Photo ${i + 1}`} width={96} height={96} className="h-24 w-24 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                  className="absolute -top-2 -right-2 cursor-pointer rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {uploadAvailable ? (
          <label className="block cursor-pointer rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-600 hover:border-brand-orange">
            {uploading ? "Uploading…" : "Click to upload a photo (max 5 MB, image only)"}
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-4">
            <p className="mb-2 text-sm text-gray-600">
              Photo upload is not configured (Cloudinary not set up). Paste an
              image URL instead — this is only a fallback until Cloudinary is
              connected:
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                className={inputCls}
                placeholder="https://…/photo.jpg"
              />
              <button
                type="button"
                onClick={() => {
                  if (manualUrl.trim()) {
                    setForm((f) => ({ ...f, images: [...f.images, manualUrl.trim()] }));
                    setManualUrl("");
                  }
                }}
                className="cursor-pointer rounded bg-brand-black px-3 py-2 text-sm font-semibold text-white"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="cursor-pointer rounded-lg bg-brand-orange px-6 py-2 font-semibold text-white hover:bg-brand-orange-dark disabled:opacity-60"
        >
          {busy ? "Saving…" : initial ? "Save Changes" : "Add Product"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="cursor-pointer rounded-lg border border-gray-200 px-6 py-2 font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
