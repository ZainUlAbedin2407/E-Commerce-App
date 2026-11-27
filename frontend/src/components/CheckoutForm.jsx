"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCart, saveOrder } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";
import {
  PAK_PHONE,
  deliveryFeePKR,
  COD_MAX_TOTAL_PKR,
  DELIVERY_FREE_UP_TO_KG,
  DELIVERY_EXTRA_KG_PKR,
} from "@/lib/site";

// Checkout: guest-first; inline per-field errors; phone validated with
// the shared PAK_PHONE; delivery fee computed by city and weight and
// shown BEFORE payment; payment method by total, COD only when
// subtotal plus delivery is at most Rs 2,000, otherwise Advance only.
// Order review shows real totals. No WhatsApp ordering anywhere:
// orders are placed on the website, and the server is the only thing
// that creates an order number.
export default function CheckoutForm() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState("COD");

  // Order review math (client-side display only, the server re-prices
  // and re-checks everything; a forged total is never trusted).
  const pricedItems = items.filter(({ product }) => product.pricePKR != null);
  const allPriced = items.length > 0 && pricedItems.length === items.length;
  const subtotal = pricedItems.reduce(
    (s, { product, qty }) => s + product.pricePKR * qty,
    0
  );
  const city = form.city.trim();
  const weightsKnown = items.every(({ product }) => product.weightKg != null);
  const totalWeight = items.reduce(
    (s, { product, qty }) => s + (product.weightKg || 0) * qty,
    0
  );
  const deliveryFee = city
    ? deliveryFeePKR(city, weightsKnown ? totalWeight : null)
    : null;
  const total = allPriced && deliveryFee != null ? subtotal + deliveryFee : null;
  const codAllowed = total != null && total <= COD_MAX_TOTAL_PKR;
  const paymentMethod = codAllowed ? method : "Advance";
  const effectiveMethod = allPriced ? paymentMethod : "COD";

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const next = {};
    if (form.firstName.trim().length < 2) next.firstName = "Enter your first name.";
    if (form.lastName.trim().length < 1) next.lastName = "Enter your last name.";
    if (form.address.trim().length < 5)
      next.address = "Enter your full address (house / street, area).";
    if (form.city.trim().length < 2) next.city = "Enter your city.";
    if (!PAK_PHONE.test(form.phone.replace(/\s/g, "")))
      next.phone = "Enter a valid Pakistani mobile number, e.g. 0335-5186552.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const fieldClass = (key) =>
    `w-full rounded-xl border bg-raised p-3 text-base text-ink placeholder:text-muted ${
      errors[key] ? "border-danger" : "border-line"
    }`;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setServerError("");
    if (items.length === 0) {
      setServerError("Your cart is empty. Add a product first.");
      return;
    }
    if (!allPriced) {
      setServerError("One or more items in your cart have no price yet, so this order cannot be placed. Remove those items and try again.");
      return;
    }
    if (!validate()) return;
    setSubmitting(true);
    const phone = form.phone.replace(/\s/g, "");
    const customer = {
      name: `${form.firstName} ${form.lastName}`.trim(),
      address: form.address,
      city: form.city,
      phone,
    };
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items: items.map(({ product, qty }) => ({ slug: product.slug, qty })),
          paymentMethod: effectiveMethod,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.order) {
        const serverOrder = {
          id: data.order.orderNo,
          orderNo: data.order.orderNo,
          createdAt: data.order.createdAt || new Date().toISOString(),
          customer,
          items: (data.order.items || []).map((it) => ({
            slug: it.slug,
            name: it.name,
            model: it.model,
            image: it.image,
            qty: it.qty,
            pricePKR: it.pricePKR ?? null,
          })),
          paymentMethod:
            data.order.paymentMethod === "Advance" ? "Advance" : "COD",
          subtotalPKR: data.order.subtotalPKR ?? null,
          deliveryFeePKR: data.order.deliveryFeePKR ?? null,
          totalPKR: data.order.totalPKR ?? null,
          status: data.order.status || "Pending",
          paymentStatus: data.order.paymentStatus || "Unpaid",
          paymentWindowExpiresAt: data.order.paymentWindowExpiresAt || null,
        };
        saveOrder(serverOrder);
        clearCart();
        toast.success("Order placed");
        router.push(`/order-confirmation?order=${serverOrder.id}`);
        return;
      }
      setServerError(
        data.error ||
          "Order could not be placed. Please try again."
      );
    } catch {
      setServerError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-10 md:px-12 lg:grid-cols-2">
      <div className="rounded-2xl border border-line bg-surface p-6">
        <h1 className="mb-6 font-display text-2xl font-bold text-ink">Checkout</h1>
        <form onSubmit={handlePlaceOrder} noValidate>
          <h2 className="mb-2 text-lg font-semibold text-ink">Delivery details</h2>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="mb-1 block text-sm font-semibold text-ink">First name</label>
              <input id="firstName" type="text" value={form.firstName} onChange={set("firstName")} className={fieldClass("firstName")} placeholder="Your first name" />
              {errors.firstName && <p className="mt-1 text-sm text-danger">{errors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1 block text-sm font-semibold text-ink">Last name</label>
              <input id="lastName" type="text" value={form.lastName} onChange={set("lastName")} className={fieldClass("lastName")} placeholder="Your last name" />
              {errors.lastName && <p className="mt-1 text-sm text-danger">{errors.lastName}</p>}
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="address" className="mb-1 block text-sm font-semibold text-ink">Full address</label>
            <input id="address" type="text" value={form.address} onChange={set("address")} className={fieldClass("address")} placeholder="House / street, area" />
            {errors.address && <p className="mt-1 text-sm text-danger">{errors.address}</p>}
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="mb-1 block text-sm font-semibold text-ink">City</label>
              <input id="city" type="text" value={form.city} onChange={set("city")} className={fieldClass("city")} placeholder="Your city, e.g. Karachi" />
              {errors.city && <p className="mt-1 text-sm text-danger">{errors.city}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-ink">Phone</label>
              <input id="phone" type="tel" value={form.phone} onChange={set("phone")} className={fieldClass("phone")} placeholder="03XX-XXXXXXX" />
              {errors.phone && <p className="mt-1 text-sm text-danger">{errors.phone}</p>}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="mb-2 text-lg font-semibold text-ink">Delivery charges</h2>
            <div className="mb-4 rounded-xl border border-line bg-raised p-4 text-sm text-muted">
              {deliveryFee != null ? (
                <p>
                  Delivery fee:{" "}
                  <span className="font-semibold text-ink">{formatPrice(deliveryFee)}</span>{" "}
                  ({city.toLowerCase().includes("karachi") ? "Karachi" : "rest of Pakistan"}
                  {weightsKnown ? `, ${totalWeight.toFixed(1)} kg` : ""}).
                </p>
              ) : (
                <p>Enter your city above to see the delivery fee.</p>
              )}
              <p className="mt-1">
                Karachi Rs 250, rest of Pakistan Rs 300 (up to {DELIVERY_FREE_UP_TO_KG} kg).
                Over {DELIVERY_FREE_UP_TO_KG} kg: +{formatPrice(DELIVERY_EXTRA_KG_PKR)} per extra kg.
              </p>
            </div>

            <h2 className="mb-2 text-lg font-semibold text-ink">Payment method</h2>
            {total == null ? (
              <div className="mb-4 rounded-xl border border-line bg-raised p-4 text-sm text-muted">
                <p>Enter your city to see the total and the payment options for this order.</p>
              </div>
            ) : codAllowed ? (
              <div className="mb-4 space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-raised p-4">
                  <input type="radio" name="pay" checked={method === "COD"} onChange={() => setMethod("COD")} className="mt-1 h-5 w-5 accent-[#FF7A1A]" />
                  <span>
                    <span className="block font-semibold text-ink">Cash on Delivery (COD)</span>
                    <span className="block text-sm text-muted">You pay in cash when the order reaches you. COD is available for orders up to {formatPrice(COD_MAX_TOTAL_PKR)}.</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-raised p-4">
                  <input type="radio" name="pay" checked={method === "Advance"} onChange={() => setMethod("Advance")} className="mt-1 h-5 w-5 accent-[#FF7A1A]" />
                  <span>
                    <span className="block font-semibold text-ink">Advance payment (100%)</span>
                    <span className="block text-sm text-muted">Pay by bank transfer, JazzCash, Easypaisa or Raast after you place the order. Payment details and the receipt upload show on the next page, and you have 24 hours to pay.</span>
                  </span>
                </label>
              </div>
            ) : (
              <div className="mb-4 rounded-xl border border-line bg-raised p-4">
                <p className="font-semibold text-ink">Advance payment (100%)</p>
                <p className="mt-1 text-sm text-muted">
                  This order totals {formatPrice(total)}, which is above the COD limit of{" "}
                  {formatPrice(COD_MAX_TOTAL_PKR)}, so it is paid 100 percent in advance. Pay by
                  bank transfer, JazzCash, Easypaisa or Raast after you place the order. Payment
                  details and the receipt upload show on the next page, and you have 24 hours to pay.
                </p>
              </div>
            )}

            <p className="mb-4 text-sm text-muted">
              Returns: check your parcel at once when it arrives. If it does not work or is not
              what you ordered, contact us with your order number and a short video or photo.{" "}
              <Link href="/returns" className="font-semibold text-battery">Returns and Warranty</Link>
            </p>
          </div>

          {serverError && (
            <p className="mb-4 rounded-xl border border-danger bg-raised p-3 text-sm font-medium text-danger">
              {serverError}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || items.length === 0}
            className="press flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full bg-battery py-3 font-semibold text-canvas hover:bg-battery-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Placing order…"
              : effectiveMethod === "Advance"
                ? "Place Order (Advance)"
                : "Place Order (COD)"}
          </button>
        </form>
      </div>

      <div className="h-fit rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink">Order summary</h2>
        {items.length === 0 ? (
          <p className="text-muted">Your cart is empty. Add a product first.</p>
        ) : (
          <>
            <div className="mb-4 border-t border-line py-4">
              {items.map(({ product, qty }) => (
                <div key={product.slug} className="flex items-start justify-between gap-3 border-b border-line py-3">
                  <div className="flex min-w-0 items-start">
                    {product.images?.[0] ? (
                      <Image src={product.images[0]} alt={product.name} width={80} height={80} className="mr-4 h-20 w-20 shrink-0 rounded-xl bg-raised object-cover" />
                    ) : (
                      <span className="mr-4 flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-raised font-display font-bold text-battery">
                        {product.name.slice(0, 1)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-base font-medium text-ink">{product.name}</h3>
                      <p className="text-sm text-muted">
                        {product.brand}
                        {product.model ? `, ${product.model}` : ""}
                      </p>
                      <p className="text-sm text-muted">Qty: {qty}</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-battery">
                    {product.pricePKR != null ? formatPrice(product.pricePKR * qty) : "Price coming soon"}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-sm text-muted">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-ink">
                  {allPriced ? formatPrice(subtotal) : "Price coming soon"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-semibold text-ink">
                  {deliveryFee != null ? formatPrice(deliveryFee) : "Enter your city"}
                </span>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-ink">
                <span>Total</span>
                <span>{total != null ? formatPrice(total) : "Enter your city"}</span>
              </div>
            </div>
            {!allPriced && (
              <p className="mt-3 text-sm text-muted">
                Items without a price cannot be ordered yet. Remove them from the cart to continue.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
