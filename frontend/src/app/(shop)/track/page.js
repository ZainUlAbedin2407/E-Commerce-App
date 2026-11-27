"use client";

import { useState } from "react";
import Link from "next/link";
import { loadOrders } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";

// Track an order with the order number and the phone number used at
// checkout. No account needed. The server is checked first via the
// guest lookup GET /api/orders/track (order number + phone is the
// credential), then this device's saved orders as a fallback.
const STEPS = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered"];

export default function TrackPage() {
  const [orderNo, setOrderNo] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [msg, setMsg] = useState("");
  const [searched, setSearched] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setOrder(null);
    setSearched(true);
    const no = orderNo.trim().toUpperCase();
    const ph = phone.replace(/[\s-]/g, "");
    if (!no || !ph) {
      setMsg("Enter the order number and the phone number you ordered with.");
      return;
    }
    // Server lookup first: order number + phone is the credential.
    try {
      const res = await fetch(
        `/api/orders/track?orderNo=${encodeURIComponent(no)}&phone=${encodeURIComponent(ph)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.order) {
          setOrder({ ...data.order, id: data.order.orderNo || data.order.id });
          return;
        }
      }
    } catch {
      // fall through to the on-device fallback
    }
    // This device's saved orders (guest checkout saves the order here).
    const local = loadOrders().find(
      (o) =>
        String(o.id || o.orderNo || "").toUpperCase() === no &&
        String(o.customer?.phone || "").replace(/[\s-]/g, "") === ph
    );
    if (local) {
      setOrder(local);
      return;
    }
    setMsg(
      "No order matches that order number and phone number. Check both and try again."
    );
  };

  const stepIndex = order ? STEPS.indexOf(order.status) : -1;
  const input =
    "min-h-12 w-full rounded-xl border border-line bg-raised p-3 text-base text-ink placeholder:text-muted";

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-12">
      <h1 className="font-display text-3xl font-bold text-ink">Track your order</h1>
      <p className="mt-2 text-muted">
        Enter the order number (e.g. AIC-0001) and the phone number you ordered
        with. No account needed.
      </p>

      <form onSubmit={submit} noValidate className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="track-no" className="mb-1 block text-sm font-semibold text-ink">Order number</label>
            <input id="track-no" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} className={input} placeholder="AIC-0001" />
          </div>
          <div>
            <label htmlFor="track-phone" className="mb-1 block text-sm font-semibold text-ink">Phone</label>
            <input id="track-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={input} placeholder="03XX-XXXXXXX" />
          </div>
        </div>
        <button
          type="submit"
          className="press mt-4 inline-flex min-h-12 items-center rounded-full bg-battery px-8 py-3 font-semibold text-canvas hover:bg-battery-deep"
        >
          Track order
        </button>
      </form>

      {msg && <p className="mt-6 rounded-2xl border border-line bg-surface p-5 text-sm text-muted">{msg}</p>}

      {order && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-ink">Order {order.id || order.orderNo}</h2>
            <span className="rounded-full bg-raised px-3 py-1 text-sm font-semibold text-battery">
              {order.status}
              {order.paymentMethod === "Advance" || order.paymentMethod === "Advance payment"
                ? `, ${order.paymentStatus || "Advance"}`
                : ", COD"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Placed {new Date(order.createdAt).toLocaleDateString()}, deliver to{" "}
            {order.customer?.city}, Pakistan. Total{" "}
            {order.totalPKR != null ? formatPrice(order.totalPKR) : "not available"}.
          </p>

          {order.status === "Cancelled" ? (
            <p className="mt-4 text-sm font-semibold text-danger">
              This order was cancelled.
              {order.paymentStatus === "Unpaid" && order.paymentMethod === "Advance"
                ? " The 24 hour payment window expired before payment."
                : ""}
            </p>
          ) : (
            <ol className="mt-6 space-y-3">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      i <= stepIndex ? "bg-battery text-canvas" : "bg-raised text-muted"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={i <= stepIndex ? "font-semibold text-ink" : "text-muted"}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          )}

          {order.timeline && order.timeline.length > 0 && (
            <div className="mt-6 border-t border-line pt-4">
              <h3 className="mb-2 font-semibold text-ink">Updates</h3>
              <ul className="space-y-2 text-sm text-muted">
                {order.timeline.map((t, i) => (
                  <li key={i}>
                    <span className="font-semibold text-ink">{t.status}</span>,{" "}
                    {t.at ? new Date(t.at).toLocaleString() : ""}
                    {t.note ? `, ${t.note}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link href={`/order/${order.id || order.orderNo}`} className="mt-6 inline-block font-semibold text-battery">
            View full order details
          </Link>
        </div>
      )}

      {searched && !order && !msg && (
        <p className="mt-6 text-muted">Looking up your order…</p>
      )}
    </div>
  );
}
