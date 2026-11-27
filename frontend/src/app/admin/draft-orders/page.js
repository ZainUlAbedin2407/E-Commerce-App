"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/products";
import {
  apiJson,
  btnPrimary,
  cardCls,
  Field,
  inputCls,
  Notice,
  useCatalogProducts,
} from "@/components/AdminUI";

export default function DraftOrdersPage() {
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "", city: "" });
  const [items, setItems] = useState([]);
  const [pickSlug, setPickSlug] = useState("");
  const [pickQty, setPickQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [status, setStatus] = useState("Pending");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const { products, loading: productsLoading, error: productsError } = useCatalogProducts();

  const setC = (key, value) => setCustomer((c) => ({ ...c, [key]: value }));

  const addItem = () => {
    if (!pickSlug) return;
    const qty = Math.max(1, Math.min(99, Number(pickQty) || 1));
    setItems((list) => {
      const found = list.find((i) => i.slug === pickSlug);
      if (found) {
        return list.map((i) => (i.slug === pickSlug ? { ...i, qty: Math.min(99, i.qty + qty) } : i));
      }
      return [...list, { slug: pickSlug, qty }];
    });
    setPickSlug("");
    setPickQty(1);
  };

  const estimate = items.reduce((sum, item) => {
    const p = products.find((x) => x.slug === item.slug);
    return sum + (p?.pricePKR != null ? p.pricePKR * item.qty : 0);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setCreated(null);
    const next = {};
    if (customer.name.trim().length < 2) next.name = "Enter the customer name.";
    if (!/^03\d{2}-?\d{7}$/.test(customer.phone.trim())) {
      next.phone = "Enter a valid Pakistani mobile number, e.g. 0335-5186552.";
    }
    if (customer.address.trim().length < 5) next.address = "Enter the full address.";
    if (customer.city.trim().length < 2) next.city = "Enter the city.";
    if (items.length === 0) next.items = "Add at least one item.";
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setBusy(true);
    try {
      const data = await apiJson("/api/admin/orders/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: customer.name.trim(),
            phone: customer.phone.trim(),
            address: customer.address.trim(),
            city: customer.city.trim(),
          },
          items,
          paymentMethod,
          status,
        }),
      });
      setCreated(data.order);
      setNotice(`Draft order ${data.order.orderNo} was created.`);
      setCustomer({ name: "", phone: "", address: "", city: "" });
      setItems([]);
    } catch (err) {
      setError(err.message || "Could not create the draft order.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-2 font-display text-2xl font-bold text-ink">New draft order</h2>
      <p className="mb-6 text-sm text-muted">
        Create an order on behalf of a customer who phoned or messaged. Pricing,
        delivery fee, cash on delivery rules and stock use the same server
        logic as a website order, so a draft can never be priced differently.
      </p>
      <Notice kind="error">{error || productsError}</Notice>
      <Notice kind="success">{notice}</Notice>
      {created && (
        <p className="mb-4 rounded-xl border border-success/50 bg-success/10 p-3 text-sm font-medium text-success">
          Order {created.orderNo} created. Total {formatPrice(created.totalPKR)}.{" "}
          <Link href={`/admin/orders/${created.orderNo}`} className="underline">
            Open it
          </Link>
        </p>
      )}
      <form onSubmit={handleSubmit} className={`${cardCls} space-y-4`}>
        <h3 className="font-display text-xl font-semibold text-ink">Customer</h3>
        <Field label="Name *" error={errors.name}>
          <input value={customer.name} onChange={(e) => setC("name", e.target.value)} className={inputCls} placeholder="Customer full name" />
        </Field>
        <Field label="Phone *" error={errors.phone} hint="Pakistani mobile, e.g. 0335-5186552.">
          <input value={customer.phone} onChange={(e) => setC("phone", e.target.value)} className={inputCls} placeholder="03XX-XXXXXXX" inputMode="tel" />
        </Field>
        <Field label="Address *" error={errors.address}>
          <textarea rows={2} value={customer.address} onChange={(e) => setC("address", e.target.value)} className={inputCls} placeholder="House, street, area" />
        </Field>
        <Field label="City *" error={errors.city}>
          <input value={customer.city} onChange={(e) => setC("city", e.target.value)} className={inputCls} placeholder="e.g. Karachi" />
        </Field>

        <h3 className="pt-2 font-display text-xl font-semibold text-ink">Items</h3>
        {errors.items && <p className="text-xs font-medium text-danger">{errors.items}</p>}
        {items.length > 0 && (
          <ul className="space-y-2">
            {items.map((item) => {
              const p = products.find((x) => x.slug === item.slug);
              return (
                <li key={item.slug} className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 text-ink">
                    {p?.name || item.slug}
                    {p?.pricePKR != null ? `, Rs ${Number(p.pricePKR).toLocaleString("en-PK")} each` : ""}
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={item.qty}
                    onChange={(e) =>
                      setItems((list) =>
                        list.map((i) =>
                          i.slug === item.slug
                            ? { ...i, qty: Math.max(1, Math.min(99, Number(e.target.value) || 1)) }
                            : i
                        )
                      )
                    }
                    className="w-20 rounded-lg border border-line bg-canvas p-2 text-center text-ink"
                    aria-label={`Quantity for ${p?.name || item.slug}`}
                  />
                  <button
                    type="button"
                    onClick={() => setItems((list) => list.filter((i) => i.slug !== item.slug))}
                    className="cursor-pointer rounded-lg border border-danger/50 px-2 py-1 text-xs font-semibold text-danger"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex gap-2">
          <select
            value={pickSlug}
            onChange={(e) => setPickSlug(e.target.value)}
            className={inputCls}
            aria-label="Choose a product"
            disabled={productsLoading}
          >
            <option value="">{productsLoading ? "Loading products..." : "Choose a product..."}</option>
            {products.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
                {p.pricePKR != null ? `, Rs ${Number(p.pricePKR).toLocaleString("en-PK")}` : ""}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            max="99"
            value={pickQty}
            onChange={(e) => setPickQty(e.target.value)}
            className="w-20 shrink-0 rounded-xl border border-line bg-raised p-3 text-center text-ink"
            aria-label="Quantity"
          />
          <button type="button" onClick={addItem} disabled={!pickSlug} className="shrink-0 cursor-pointer rounded-xl border border-line bg-raised px-4 py-2 font-semibold text-ink hover:border-battery disabled:opacity-60">
            Add
          </button>
        </div>
        {items.length > 0 && (
          <p className="text-sm text-muted">
            Items subtotal (estimate): {formatPrice(estimate)}. The server
            confirms the final total, including the delivery fee, when the
            order is created.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Payment method">
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputCls}>
              <option value="COD">Cash on delivery</option>
              <option value="Advance">Advance payment</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
            </select>
          </Field>
        </div>

        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? "Creating..." : "Create draft order"}
        </button>
      </form>
    </div>
  );
}
