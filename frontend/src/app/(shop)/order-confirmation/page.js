"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { loadOrders } from "@/lib/cart-context";
import { WHATSAPP_NUMBER, whatsappLink } from "@/lib/site";

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

  if (!loaded) return <p className="p-10 text-center text-gray-500">Loading…</p>;

  // Server orders carry a prefilled WhatsApp link from the API; local
  // orders build the same message on the client.
  const message = order
    ? `Assalam-o-Alaikum AI Communication! Maine order ${order.id} place kiya hai (COD). Items: ${order.items
        .map((i) => `${i.name} x${i.qty}`)
        .join(", ")}. Please price aur delivery charges confirm kar dein.`
    : "Assalam-o-Alaikum AI Communication! Mujhe apna order confirm karna hai.";
  const whatsappHref = order?.whatsappUrl || whatsappLink(message);

  return (
    <div className="min-h-screen bg-brand-paper px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-lg">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
        <h1 className="mb-6 text-center font-display text-2xl font-bold text-green-700 md:text-3xl">
          Thank You for Your Order!
        </h1>

        {order ? (
          <>
            <div className="mb-6 flex justify-between text-sm text-gray-600">
              <div>
                <p className="font-medium">Order ID: {order.id}</p>
                <p>Order date: {new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-700">Status: {order.status}</p>
                <p>Payment: {order.paymentMethod}</p>
              </div>
            </div>

            <div className="mb-6 rounded-md border border-gray-200 p-4">
              {order.items.map((item) => (
                <div
                  key={item.slug}
                  className="flex items-center justify-between border-b border-gray-200 py-3 last:border-b-0"
                >
                  <div className="flex items-center space-x-4">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded object-cover"
                    />
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.model} · Qty: {item.qty}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-brand-orange">
                    WhatsApp for price
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-sm text-gray-700">
              <div>
                <p className="mb-1 font-semibold">Payment</p>
                <p>Cash on Delivery</p>
                <p className="mt-2 text-gray-500">
                  Delivery charges: {order.deliveryFee}
                </p>
              </div>
              <div className="text-right">
                <p className="mb-1 font-semibold">Deliver to</p>
                <p>{order.customer.name}</p>
                <p>
                  {order.customer.address}, {order.customer.city}
                </p>
                <p>{order.customer.phone}</p>
              </div>
            </div>

            <div className="mt-8 rounded-lg bg-orange-50 p-4 text-center">
              <p className="mb-3 font-semibold text-brand-black">
                Next step: confirm your order on WhatsApp
              </p>
              <p className="mb-4 text-sm text-gray-600">
                Tap below — your order details are already written in the message.
                We confirm the price and delivery charges there.
              </p>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-brand-orange px-6 py-3 font-semibold text-white hover:bg-brand-orange-dark"
              >
                Confirm on WhatsApp — {WHATSAPP_NUMBER}
              </a>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-600">
            We could not find this order on this device. If you placed an
            order while signed out, it is saved on the device where you placed
            it — sign in to see orders on your account, or confirm it on
            WhatsApp.
          </p>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-gray-500">Loading…</p>}>
      <ConfirmationInner />
    </Suspense>
  );
}
