"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { loadOrders } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";
import PaymentDetails from "@/components/PaymentDetails";

// Order confirmation: the order number is the receipt (date,
// description, quantity, price, seller name and address). Advance
// orders show the payment details and receipt upload here. COD orders
// show the total collected at delivery. No WhatsApp confirmation step.
function ConfirmationInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [order, setOrder] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const found = loadOrders().find((o) => o.id === orderId);
    setOrder(found || null);
    setLoaded(true);
  }, [orderId]);

  if (!loaded) return <p className="p-10 text-center text-muted">Loading…</p>;

  const isAdvance =
    order?.paymentMethod === "Advance" || order?.paymentMethod === "Advance payment";
  const orderNo = order?.orderNo || order?.id;

  return (
    <div className="min-h-screen bg-canvas px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-success" />
          <h1 className="mb-6 text-center font-display text-2xl font-bold text-ink md:text-3xl">
            Thank you for your order
          </h1>

          {order ? (
            <>
              <div className="mb-6 flex flex-col justify-between gap-3 text-sm text-muted sm:flex-row">
                <div>
                  <p className="font-semibold text-ink">Order: {orderNo}</p>
                  <p>Order date: {new Date(order.createdAt).toLocaleString()}</p>
                  <p>AI Communication, Shahjahan Electronics Market, Saddar, Karachi</p>
                </div>
                <div className="sm:text-right">
                  <p className="font-semibold text-ink">Status: {order.status}</p>
                  <p>Payment: {isAdvance ? "Advance payment" : "Cash on Delivery"}</p>
                </div>
              </div>

              <div className="mb-6 rounded-xl border border-line bg-raised p-4">
                {order.items.map((item) => (
                  <div
                    key={item.slug}
                    className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 rounded-lg bg-surface object-cover"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{item.name}</p>
                        <p className="text-sm text-muted">
                          {item.model} Qty: {item.qty}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-battery">
                      {item.pricePKR != null
                        ? formatPrice(item.pricePKR * item.qty)
                        : "Price coming soon"}
                    </p>
                  </div>
                ))}
                <div className="space-y-1 pt-3 text-sm text-muted">
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

              <div className="flex flex-col justify-between gap-4 text-sm text-muted sm:flex-row">
                <div>
                  <p className="mb-1 font-semibold text-ink">Payment</p>
                  <p>
                    {isAdvance
                      ? "Advance payment. Pay with the details below, then upload the receipt."
                      : "Cash on Delivery. You pay in cash when the order reaches you."}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="mb-1 font-semibold text-ink">Deliver to</p>
                  <p>{order.customer.name}</p>
                  <p>
                    {order.customer.address}, {order.customer.city}
                  </p>
                  <p>{order.customer.phone}</p>
                </div>
              </div>

              <p className="mt-6 text-sm text-muted">
                Keep your order number safe, you need it to track the order and
                for any warranty claim.{" "}
                <Link href={`/order/${orderNo}`} className="font-semibold text-battery">
                  View order
                </Link>{" "}
                or{" "}
                <Link href="/track" className="font-semibold text-battery">
                  track it here
                </Link>
                .
              </p>
            </>
          ) : (
            <p className="text-center text-muted">
              We could not find this order on this device. If you placed an
              order while signed out, it is saved on the device where you placed
              it. Sign in to see orders on your account.
            </p>
          )}
        </div>

        {order && isAdvance && (
          <div className="mt-6">
            <PaymentDetails orderNo={orderNo} totalPKR={order.totalPKR} />
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="press inline-flex min-h-12 items-center rounded-full bg-battery px-8 py-3 font-semibold text-canvas hover:bg-battery-deep"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-muted">Loading…</p>}>
      <ConfirmationInner />
    </Suspense>
  );
}
