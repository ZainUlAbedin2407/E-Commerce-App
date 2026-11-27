"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatPrice, getCategory, CATEGORIES } from "@/lib/products";
import { btnGhost, btnPrimary, cardCls, DeleteButton, inputCls, Notice } from "@/components/AdminUI";

export default function ProductManagementPage() {
  const [products, setProducts] = useState(null);
  const [brands, setBrands] = useState([]);
  const [dbConnected, setDbConnected] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleting, setDeleting] = useState("");
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const load = () => {
    setError("");
    setNotConfigured(false);
    fetch("/api/admin/products?limit=100")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          if (data.code === "db_not_configured") setNotConfigured(true);
          else setError(data.error || "Could not load products.");
          setProducts([]);
          setDbConnected(false);
          return;
        }
        setProducts(data.products || []);
        setDbConnected(true);
      })
      .catch(() => {
        setError("Could not load products. Check your connection.");
        setProducts([]);
        setDbConnected(false);
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (products || []).filter((p) => {
      if (brandFilter && String(p.brandId || "") !== brandFilter && (p.brand || "") !== brandFilter) return false;
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (!q) return true;
      return [p.name, p.model, p.brand, p.slug].join(" ").toLowerCase().includes(q);
    });
  }, [products, search, brandFilter, categoryFilter]);

  const handleDelete = async (product) => {
    if (!dbConnected) return;
    setDeleting(product.id || product.slug);
    setError("");
    setNotice("");
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(product.id || product.slug)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Delete failed.");
        return;
      }
      setNotice(`"${product.name}" was deleted.`);
      load();
    } catch {
      setError("Delete failed. Check your connection.");
    } finally {
      setDeleting("");
    }
  };

  if (!products) return <p className="p-4 text-muted">Loading...</p>;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold text-ink">Products</h2>
        {dbConnected && (
          <Link href="/admin/products/new" className={btnPrimary}>
            Add Product
          </Link>
        )}
      </div>
      <p className="mb-6 text-sm text-muted">
        {dbConnected
          ? `${products.length} product${products.length === 1 ? "" : "s"} in the database. Add, edit or delete. No code, no redeploy.`
          : notConfigured
            ? "Database not connected. Set MONGODB_URI to manage products here. The shop keeps serving the launch catalogue meanwhile."
            : "Products could not be loaded."}
      </p>
      {notConfigured && (
        <div className={`${cardCls} mb-4 text-center`}>
          <p className="mb-2 font-display text-lg font-semibold text-ink">Database not connected</p>
          <p className="text-sm text-muted">
            Set MONGODB_URI in Vercel settings (or .env.local for local dev),
            then redeploy. Until then the shop serves the launch catalogue and
            products cannot be managed here.
          </p>
        </div>
      )}
      <Notice kind="error">{error}</Notice>
      {error && (
        <button type="button" onClick={load} className={`${btnGhost} mb-4`}>
          Retry
        </button>
      )}
      <Notice kind="success">{notice}</Notice>

      {!notConfigured && !error && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputCls}
              placeholder="Search by name, model or brand"
              aria-label="Search products"
            />
            <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className={inputCls} aria-label="Filter by brand">
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b.id || b.slug} value={b.id || b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={inputCls} aria-label="Filter by category">
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="min-w-full text-left text-sm text-muted">
              <thead className="whitespace-nowrap text-ink">
                <tr className="border-b border-line">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id || product.slug} className="border-b border-line align-top last:border-0">
                    <td className="p-4 font-medium text-ink">
                      {product.name}
                      {product.isNew && <span className="ml-2 rounded bg-battery/15 px-2 py-0.5 text-xs font-semibold text-battery">New</span>}
                      {product.isFeatured && <span className="ml-2 rounded bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">Featured</span>}
                      {product.active === false && (
                        <span className="ml-2 rounded bg-raised px-2 py-0.5 text-xs text-muted">Hidden</span>
                      )}
                    </td>
                    <td className="p-4">{product.model}</td>
                    <td className="p-4">{getCategory(product.category)?.name || product.category}</td>
                    <td className="p-4 font-semibold text-ink">
                      {product.pricePKR != null ? formatPrice(product.pricePKR) : "No price set"}
                    </td>
                    <td className="p-4">
                      {product.stock != null ? product.stock : "Not tracked"}
                      {product.stock != null &&
                        product.lowStockThreshold != null &&
                        product.stock <= product.lowStockThreshold && (
                          <span className="ml-2 font-semibold text-danger">Low</span>
                        )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/products/${product.id || product.slug}/edit`}
                          className="inline-flex min-h-11 items-center rounded-lg border border-line bg-raised px-3 py-2 font-semibold text-ink hover:border-battery"
                        >
                          Edit
                        </Link>
                        <DeleteButton
                          label="Delete"
                          busy={deleting === (product.id || product.slug)}
                          onDelete={() => handleDelete(product)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center">
                      {products.length === 0
                        ? "No products yet. Add your first product."
                        : "No products match the search or filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
