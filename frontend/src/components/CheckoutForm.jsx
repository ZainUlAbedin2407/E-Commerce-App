"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCart, saveOrder } from "@/lib/cart-context";
import { WHATSAPP_NUMBER, whatsappLink } from "@/lib/site";

const PAK_PHONE = /^03\d{2}-?\d{7}$/;

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
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Your cart is empty. Add a product first.");
      return;
    }
    const phone = form.phone.replace(/\s/g, "");
    if (!PAK_PHONE.test(phone)) {
      setError("Please enter a valid Pakistani mobile number, e.g. 0335-5186552.");
      return;
    }
    const customer = {
      name: `${form.firstName} ${form.lastName}`.trim(),
      address: form.address,
      city: form.city,
      phone,
    };
    const cartItems = items.map(({ product, qty }) => ({
      slug: product.slug,
      name: product.name,
      model: product.model,
      image: product.images[0],
      qty,
    }));

    // Try the server first: it re-prices from the database, validates stock
    // and creates the real order (AIC-0001, …). If the database is not
    // connected yet (503 orders_db_not_configured) we keep the Phase 1
    // local order + WhatsApp flow exactly as before — no fake server order.
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items: items.map(({ product, qty }) => ({ slug: product.slug, qty })),
          paymentMethod: "COD",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.order) {
        const serverOrder = {
          id: data.order.orderNo,
          orderNo: data.order.orderNo,
          createdAt: data.order.createdAt || new Date().toISOString(),
          customer,
          items: cartItems,
          paymentMethod: "Cash on Delivery",
          deliveryFee: "Calculated on WhatsApp confirmation",
          status: data.order.status || "Pending",
          whatsappUrl: data.whatsappUrl || "",
        };
        saveOrder(serverOrder);
        clearCart();
        toast.success("Order placed! Confirm it on WhatsApp.");
        router.push(`/order-confirmation?order=${serverOrder.id}`);
        return;
      }
      if (data.code !== "orders_db_not_configured" && data.error) {
        setError(data.error);
        return;
      }
      // else: fall through to the local order below.
    } catch {
      // Network error talking to our own API — local order still works.
    }

    const order = {
      id: `AIC-${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
      customer,
      items: cartItems,
      paymentMethod: "Cash on Delivery",
      deliveryFee: "Calculated on WhatsApp confirmation",
      status: "Pending",
    };
    saveOrder(order);
    clearCart();
    toast.success("Order placed! Confirm it on WhatsApp.");
    router.push(`/order-confirmation?order=${order.id}`);
  };

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-2">
      <div className="rounded-lg bg-white p-6">
        <h2 className="mb-6 font-display text-2xl font-bold uppercase">Checkout</h2>
        <form onSubmit={handlePlaceOrder}>
          <h3 className="mb-2 text-lg font-semibold">Delivery Details</h3>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-gray-700">First Name</label>
              <input
                id="firstName"
                type="text"
                required
                value={form.firstName}
                onChange={set("firstName")}
                className="w-full rounded border border-gray-200 p-2"
                placeholder="Your first name"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-gray-700">Last Name</label>
              <input
                id="lastName"
                type="text"
                required
                value={form.lastName}
                onChange={set("lastName")}
                className="w-full rounded border border-gray-200 p-2"
                placeholder="Your last name"
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="address" className="block text-gray-700">Full Address</label>
            <input
              id="address"
              type="text"
              required
              value={form.address}
              onChange={set("address")}
              className="w-full rounded border border-gray-200 p-2"
              placeholder="House / street, area"
            />
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-gray-700">City</label>
              <input
                id="city"
                type="text"
                required
                value={form.city}
                onChange={set("city")}
                className="w-full rounded border border-gray-200 p-2"
                placeholder="Your city"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-gray-700">Phone (WhatsApp)</label>
              <input
                id="phone"
                type="tel"
                required
                value={form.phone}
                onChange={set("phone")}
                className="w-full rounded border border-gray-200 p-2"
                placeholder="03XX-XXXXXXX"
              />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-2 text-lg font-semibold">Payment Method</h3>
            <div className="mb-4">
              <input
                type="text"
                value="Cash on Delivery (COD)"
                disabled
                className="w-full rounded border border-brand-orange bg-orange-50 p-3 font-medium text-gray-700 focus:outline-none"
              />
              <p className="mt-2 text-sm text-gray-500">
                Online payment is not available yet. You pay in cash when the
                order reaches you.
              </p>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Delivery Charges</h3>
            <p className="mb-4 rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              Calculated on WhatsApp confirmation — we confirm the delivery
              charges with you on WhatsApp before dispatch.
            </p>
          </div>

          {error && (
            <p className="mb-4 rounded bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full cursor-pointer rounded bg-brand-orange py-3 font-semibold text-white transition hover:bg-brand-orange-dark"
          >
            Place Order (COD)
          </button>
        </form>
      </div>

      <div className="h-fit rounded-lg bg-gray-50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Order Summary</h3>
        {items.length === 0 ? (
          <p className="text-gray-500">
            Your cart is empty. Prices are confirmed on WhatsApp before delivery.
          </p>
        ) : (
          <>
            <div className="mb-4 border-t border-gray-200 py-4">
              {items.map(({ product, qty }) => (
                <div
                  key={product.id}
                  className="flex items-start justify-between border-b border-gray-200 py-2"
                >
                  <div className="flex items-start">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={80}
                      height={96}
                      className="mr-4 h-24 w-20 rounded object-cover"
                    />
                    <div>
                      <h3 className="text-base font-medium">{product.name}</h3>
                      <p className="text-gray-500">
                        {product.brand} · {product.model}
                      </p>
                      <p className="text-sm text-gray-500">Qty: {qty}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-brand-orange">
                    WhatsApp for price
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Total is confirmed on WhatsApp after you place the order — prices
              are not set yet. Questions? WhatsApp us at {WHATSAPP_NUMBER}.
            </p>
            <a
              href={whatsappLink("Assalam-o-Alaikum! Mujhe order karna hai.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block font-semibold text-brand-orange hover:text-brand-orange-dark"
            >
              Chat on WhatsApp →
            </a>
          </>
        )}
      </div>
    </div>
  );
}
