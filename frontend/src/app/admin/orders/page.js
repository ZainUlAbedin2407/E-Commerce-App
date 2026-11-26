"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadOrders } from "@/lib/cart-context";

const STATUSES = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"];

export default function OrderManagementPage() {
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    // Server orders first (every customer's order, any device). Falls back
    // to this device's local orders when the database is not connected.
    fetch("/api/admin/orders")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.orders) {
          setOrders(data.orders.map((o) => ({ ...o, id: o.orderNo || o._id })));
          setDbConnected(true);
        } else {
          setOrders(loadOrders());
        }
      })
      .catch(() => setOrders(loadOrders()))
      .finally(() => setLoaded(true));
  };

  useEffect(load, []);

  const handleStatus = async (order, status) => {
    if (!dbConnected) return;
    setError("");
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(order._id || order.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    if (!res || !res.ok) {
      const data = res ? await res.json().catch(() => ({})) : {};
      setError(data.error || "Could not update the order status.");
      return;
    }
    setOrders((list) =>
      list.map((o) => (o.id === order.id ? { ...o, status } : o))
    );
  };

  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-2 font-display text-2xl font-bold">Order Management</h2>
      <p className="mb-6 text-sm text-gray-600">
        {dbConnected
          ? "All customer orders from the database. Change a status and it updates for the customer too."
          : "Database not connected — showing orders placed on this device only. Connect the database to see every customer's order here."}
      </p>
      {error && (
        <p className="mb-4 rounded bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>
      )}
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full text-left text-gray-500">
          <thead className="bg-gray-100 text-xs uppercase whitespace-nowrap text-gray-700">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {!loaded ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">Loading…</td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-200 align-top hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">
                    <Link href={`/order/${order.id}`} className="text-brand-orange hover:underline">
                      #{order.id}
                    </Link>
                  </td>
                  <td className="p-4">{order.customer.name}</td>
                  <td className="p-4">{order.customer.city}</td>
                  <td className="p-4">{order.items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td className="p-4">{order.paymentMethod}</td>
                  <td className="p-4">
                    {dbConnected ? (
                      <select
                        value={order.status}
                        onChange={(e) => handleStatus(order, e.target.value)}
                        className="cursor-pointer rounded border border-gray-200 bg-white px-2 py-1 text-sm font-medium text-gray-700"
                        aria-label={`Status for order ${order.id}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                        {order.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
