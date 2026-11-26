"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { loadOrders } from "@/lib/cart-context";
import { whatsappLink } from "@/lib/site";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [source, setSource] = useState("device");

  useEffect(() => {
    // Signed-in customers see their account orders (any device). Guests
    // and DB-not-connected setups fall back to this device's local orders.
    fetch("/api/orders/my")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.orders) {
          setOrders(
            data.orders.map((o) => ({ ...o, id: o.orderNo || o.id }))
          );
          setSource("account");
        } else {
          setOrders(loadOrders());
        }
      })
      .catch(() => setOrders(loadOrders()))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return <p className="p-10 text-center text-gray-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <h2 className="mb-2 font-display text-xl font-bold sm:text-2xl">My Orders</h2>
      <p className="mb-6 text-sm text-gray-600">
        {source === "account"
          ? "Orders on your account — visible on any device."
          : "Orders placed on this device. Sign in to keep them on your account."}
      </p>
      {orders.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center">
          <p className="mb-4 text-gray-600">You have no orders yet.</p>
          <Link
            href="/collections/all"
            className="inline-block rounded-lg bg-brand-orange px-6 py-3 font-semibold text-white hover:bg-brand-orange-dark"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="min-w-full text-left text-gray-500">
            <thead className="bg-gray-100 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Deliver To</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {order.items[0] && (
                      <Image
                        src={order.items[0].image}
                        alt={order.items[0].name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap text-gray-900">
                    <Link href={`/order/${order.id}`} className="text-brand-orange hover:underline">
                      #{order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(order.createdAt).toLocaleDateString()}{" "}
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3">
                    {order.customer.city}, Pakistan
                  </td>
                  <td className="px-4 py-3 text-center">{order.items.length}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium whitespace-nowrap text-yellow-700">
                      {order.status} — COD
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-6 text-sm text-gray-500">
        Order status is confirmed on WhatsApp:{" "}
        <a
          href={whatsappLink("Assalam-o-Alaikum! Mere order ka status bata dein.")}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand-orange"
        >
          Chat on WhatsApp
        </a>
      </p>
    </div>
  );
}
