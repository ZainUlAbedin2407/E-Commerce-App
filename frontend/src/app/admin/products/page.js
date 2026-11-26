"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PRODUCTS, formatPrice, getCategory } from "@/lib/products";

export default function ProductManagementPage() {
  const [products, setProducts] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState("");

  const load = () => {
    fetch("/api/admin/products")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.products) {
          setProducts(data.products);
          setDbConnected(true);
        } else {
          setProducts(PRODUCTS);
        }
      })
      .catch(() => setProducts(PRODUCTS));
  };

  useEffect(load, []);

  const handleDelete = async (product) => {
    if (!dbConnected) return;
    const label = product.name || product.slug;
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    setDeleting(product._id || product.slug);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(product._id || product.slug)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Delete failed.");
        return;
      }
      load();
    } catch {
      setError("Delete failed — check your connection.");
    } finally {
      setDeleting("");
    }
  };

  if (!products) return <p className="p-4 text-gray-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">Product Management</h2>
        {dbConnected && (
          <Link
            href="/admin/products/new"
            className="rounded-lg bg-brand-orange px-4 py-2 font-semibold text-white hover:bg-brand-orange-dark"
          >
            + Add Product
          </Link>
        )}
      </div>
      <p className="mb-6 text-sm text-gray-600">
        {dbConnected
          ? `${products.length} product${products.length === 1 ? "" : "s"} in the database. Add, edit or delete — no code, no redeploy.`
          : "DB not connected — showing launch catalogue. Connect the database to add, edit or delete products here."}
      </p>
      {error && (
        <p className="mb-4 rounded bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>
      )}
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full text-left text-gray-500">
          <thead className="bg-gray-100 text-xs uppercase whitespace-nowrap text-gray-700">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product._id || product.id || product.slug}
                className="border-b border-gray-200 align-top hover:bg-gray-50"
              >
                <td className="p-4 font-medium text-gray-900">
                  {product.name}
                  {product.active === false && (
                    <span className="ml-2 rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">hidden</span>
                  )}
                </td>
                <td className="p-4">{product.model}</td>
                <td className="p-4">{getCategory(product.category)?.name || product.category}</td>
                <td className="p-4">
                  {product.pricePKR != null ? formatPrice(product.pricePKR) : "WhatsApp for price"}
                </td>
                <td className="p-4">
                  {product.stock != null ? product.stock : "not tracked"}
                </td>
                <td className="p-4">
                  {dbConnected ? (
                    <>
                      <Link
                        href={`/admin/products/${product._id || product.slug}/edit`}
                        className="mr-2 rounded bg-yellow-500 px-2 py-1 text-white hover:bg-yellow-600"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product)}
                        disabled={deleting === (product._id || product.slug)}
                        className="cursor-pointer rounded bg-red-600 px-2 py-1 text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {deleting === (product._id || product.slug) ? "Deleting…" : "Delete"}
                      </button>
                    </>
                  ) : (
                    <span className="rounded bg-gray-200 px-2 py-1 whitespace-nowrap text-gray-500" title="Connect the database to manage products">
                      Read-only
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
