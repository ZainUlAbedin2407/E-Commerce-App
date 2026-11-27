"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminProductForm from "@/components/AdminProductForm";
import { btnPrimary, Notice } from "@/components/AdminUI";

export default function EditProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    setLoaded(false);
    fetch(`/api/admin/products/${encodeURIComponent(id)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data?.product) {
          // Never fall back to the seed product. Saving it would overwrite
          // the real database product with seed values. Show the error.
          setError(data.error || "Could not load this product.");
          setProduct(null);
        } else {
          setProduct(data.product);
        }
      })
      .catch(() => {
        setError("Could not load this product. Check your connection.");
        setProduct(null);
      })
      .finally(() => setLoaded(true));
  };

  useEffect(load, [id]);

  const handleSave = async (payload) => {
    const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not save the product.");
  };

  if (!loaded) return <p className="p-4 text-muted">Loading...</p>;

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-2 font-display text-2xl font-bold text-ink">Edit Product</h2>
        <Notice kind="error">{error}</Notice>
        {error ? (
          <>
            <button onClick={load} className={`${btnPrimary} mr-3`}>
              Retry
            </button>
            <Link href="/admin/products" className="font-semibold text-battery">
              Back to Products
            </Link>
          </>
        ) : (
          <p className="text-muted">
            Product &ldquo;{id}&rdquo; was not found.{" "}
            <Link href="/admin/products" className="font-semibold text-battery">
              Back to Products
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-2 font-display text-2xl font-bold text-ink">Edit Product</h2>
      <p className="mb-6 text-sm text-muted">
        {product.brand} · {product.model} · {product.category}
      </p>
      <AdminProductForm initial={product} onSave={handleSave} />
    </div>
  );
}
