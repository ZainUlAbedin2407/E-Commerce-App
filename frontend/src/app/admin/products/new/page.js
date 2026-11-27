"use client";

import AdminProductForm from "@/components/AdminProductForm";

export default function NewProductPage() {
  const handleSave = async (payload) => {
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not add the product.");
  };

  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-2 font-display text-2xl font-bold text-ink">Add Product</h2>
      <p className="mb-6 text-sm text-muted">
        The product goes live on the shop as soon as you save it. No code, no
        redeploy. Give it a real price, real weight and real specs.
      </p>
      <AdminProductForm onSave={handleSave} />
    </div>
  );
}
