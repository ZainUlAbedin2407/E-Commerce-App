"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { loadOrders } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";
import PaymentDetails from "@/components/PaymentDetails";

// Order page: signed-in customers read the server order first; guests
// fall back to this device's saved order. Advance orders show the
// payment details and receipt upload here. COD orders show the total
// collected at delivery. No WhatsApp ordering anywhere.
export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.order) {
          setOrder({ ...data.order, id: data.order.orderNo || data.order.id });
        } else {
          setOrder(loadOrders().find((o) => o.id === id) || null);
        }
      })
      .catch(() => setOrder(loadOrders().find((o) => o.id === id) || null))
      .finally(() => setLoaded(true));
  }, [id]);

  if (!loaded) return <p className="p-10 text-center text-muted">Loading…</p>;

  const isAdvance = order
    ? order.paymentMethod === "Advance" || order.paymentMethod === "Advance payment"
    : false;
  const orderNo = order?.orderNo || order?.id;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-12">
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Order details</h1>
      {!order ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center">
          <p className="mb-4 text-muted">
            Order {id} was not found. It may have been placed on another device
            while signed out, or in another browser on this device. Sign in to
            see orders on your account. If you placed it as a guest, claim it
            on the My Orders page with the order number and the phone number
            you ordered with.
          </p>
          <Link href="/my-orders" className="font-semibold text-battery hover:underline">
            Back to My Orders
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row">
              <div>
                <h2 className="text-lg font-semibold text-ink">Order {orderNo}</h2>
                <p className="text-sm text-muted">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <span className="rounded-full bg-raised px-3 py-1 text-sm font-semibold text-ink">
                  {order.status}
                </span>
                <span className="rounded-full bg-raised px-3 py-1 text-sm font-semibold text-battery">
                  {isAdvance ? "Advance payment" : "Cash on Delivery"}
                </span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold text-ink">Deliver to</h3>
                <p className="text-sm text-muted">{order.customer.name}</p>
                <p className="text-sm text-muted">
                  {order.customer.address}, {order.customer.city}, Pakistan
                </p>
                <p className="text-sm text-muted">{order.customer.phone}</p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-ink">Payment</h3>
                <p className="text-sm text-muted">
                  {isAdvance
                    ? `Advance payment. Status: ${order.paymentStatus || "Unpaid"}.`
                    : "Cash on Delivery. You pay in cash when the order reaches you."}
                </p>
                {order.paymentWindowExpiresAt && isAdvance && (
                  <p className="mt-1 text-sm text-muted">
                    Pay by {new Date(order.paymentWindowExpiresAt).toLocaleString()}.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6">
              <h3 className="mb-3 font-semibold text-ink">Items</h3>
              <ul className="divide-y divide-line">
                {order.items.map((item) => (
                  <li key={item.slug} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 rounded-lg bg-raised object-cover"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <Link href={`/product/${item.slug}`} className="text-sm font-semibold text-ink hover:text-battery">
                          {item.name}
                        </Link>
                        <p className="text-xs text-muted">Qty: {item.qty}</p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-battery">
                      {item.pricePKR != null ? formatPrice(item.pricePKR * item.qty) : "Price coming soon"}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 text-sm text-muted">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-ink">
                    {order.subtotalPKR != null ? formatPrice(order.subtotalPKR) : "Not available"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="font-semibold text-ink">
                    {order.deliveryFeePKR != null ? formatPrice(order.deliveryFeePKR) : "Not available"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-ink">
                  <span>Total</span>
                  <span>{order.totalPKR != null ? formatPrice(order.totalPKR) : "Not available"}</span>
                </div>
              </div>
            </div>
            {order.timeline && order.timeline.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 font-semibold text-ink">Status timeline</h3>
                <ol className="space-y-2">
                  {order.timeline.map((t, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="font-semibold text-ink">{t.status}</span>
                      <span className="text-muted">
                        {t.at ? new Date(t.at).toLocaleString() : ""}
                        {t.note ? `, ${t.note}` : ""}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <Link href="/my-orders" className="mt-6 inline-block font-semibold text-battery hover:underline">
              Back to My Orders
            </Link>
          </div>

          {isAdvance && order.paymentStatus !== "Paid" && (
            <PaymentDetails orderNo={orderNo} totalPKR={order.totalPKR} />
          )}
          {isAdvance && order.paymentStatus === "Paid" && (
            <p className="rounded-2xl border border-line bg-surface p-5 text-sm font-semibold text-success">
              This order is paid. Thank you, your order is being prepared.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
