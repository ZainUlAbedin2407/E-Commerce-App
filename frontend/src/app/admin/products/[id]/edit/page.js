"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminProductForm from "@/components/AdminProductForm";
import { getProduct } from "@/lib/products";

export default function EditProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/products/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.product) setProduct(data.product);
        else setProduct(getProduct(id) || null);
      })
      .catch(() => setProduct(getProduct(id) || null))
      .finally(() => setLoaded(true));
  }, [id]);

  const handleSave = async (payload) => {
    const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not save the product.");
  };

  if (!loaded) return <p className="p-4 text-gray-500">Loading…</p>;

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-2 font-display text-2xl font-bold">Edit Product</h2>
        <p className="text-gray-600">
          Product &ldquo;{id}&rdquo; was not found.{" "}
          <Link href="/admin/products" className="font-semibold text-brand-orange">
            Back to Products
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-2 font-display text-2xl font-bold">Edit Product</h2>
      <p className="mb-6 text-sm text-gray-600">
        {product.brand} · {product.model} · {product.category}
      </p>
      {error && (
        <p className="mb-4 rounded bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>
      )}
      <AdminProductForm initial={product} onSave={handleSave} />
    </div>
  );
}
