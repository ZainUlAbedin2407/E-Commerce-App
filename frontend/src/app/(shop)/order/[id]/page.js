"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { loadOrders } from "@/lib/cart-context";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Signed-in customers/admins read the server order first; guests and
    // DB-not-connected setups fall back to this device's local order.
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

  if (!loaded) return <p className="p-10 text-center text-gray-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <h2 className="mb-6 font-display text-2xl font-bold md:text-3xl">Order Details</h2>
      {!order ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center">
          <p className="mb-4 text-gray-600">
            Order #{id} was not found — it may have been placed on another
            device while signed out, or on this device in another browser.
            Sign in to see orders on your account.
          </p>
          <Link href="/my-orders" className="font-semibold text-brand-orange hover:underline">
            Back to My Orders
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
          <div className="mb-8 flex flex-col justify-between sm:flex-row">
            <div>
              <h3 className="text-lg font-semibold md:text-xl">Order ID: #{order.id}</h3>
              <p className="text-gray-600">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div className="mt-4 flex flex-col items-start sm:mt-0 sm:items-end">
              <span className="mb-2 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                {order.status}
              </span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                Cash on Delivery
              </span>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <h4 className="mb-2 text-lg font-semibold">Payment Info</h4>
              <p>Payment Method: {order.paymentMethod}</p>
              <p>Status: Unpaid (pay on delivery)</p>
            </div>
            <div>
              <h4 className="mb-2 text-lg font-semibold">Delivery Info</h4>
              <p>Customer: {order.customer.name}</p>
              <p>
                Address: {order.customer.address}, {order.customer.city}, Pakistan
              </p>
              <p>Phone: {order.customer.phone}</p>
            </div>
            <div>
              <h4 className="mb-2 text-lg font-semibold">Delivery Charges</h4>
              <p>{order.deliveryFee}</p>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <h4 className="mb-4 text-lg font-semibold">Products</h4>
            <table className="mb-4 w-full min-w-[600px] text-gray-600">
              <thead className="bg-gray-100 whitespace-nowrap">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Price</th>
                  <th className="px-4 py-2 text-left">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.slug} className="border-b border-gray-200">
                    <td className="px-4 py-2">
                      <div className="flex items-center">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="mr-4 h-12 w-12 rounded-lg object-cover"
                        />
                        <Link
                          href={`/product/${item.slug}`}
                          className="text-sm text-brand-orange hover:underline"
                        >
                          {item.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm">WhatsApp for price</td>
                    <td className="px-4 py-2 text-sm">{item.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Link href="/my-orders" className="font-semibold text-brand-orange hover:underline">
            Back to My Orders
          </Link>
        </div>
      )}
    </div>
  );
}
