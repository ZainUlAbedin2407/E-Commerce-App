"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORIES, PRODUCTS, formatPrice } from "@/lib/products";

export default function AdminHomePage() {
  const [stats, setStats] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setStats(data);
          setDbConnected(true);
        }
      })
      .catch(() => {});
  }, []);

  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    count: PRODUCTS.filter((p) => p.category === c.slug).length,
  }));

  const totalProducts = stats?.totalProducts ?? PRODUCTS.length;
  const totalOrders = stats?.totalOrders ?? "—";
  const pendingOrders = stats?.pendingOrders ?? "—";
  const totalUsers = stats?.totalUsers ?? "—";
  const revenue =
    stats && stats.totalRevenuePKR != null
      ? formatPrice(stats.totalRevenuePKR)
      : "WhatsApp for price";

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-2 font-display text-3xl font-bold">Admin Dashboard</h1>
      <p className="mb-6 text-gray-600">
        AI Communication —{" "}
        {dbConnected
          ? "live stats from the database."
          : "launch catalogue. Database not connected — showing launch counts."}
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow-md">
          <h2 className="text-xl font-semibold">Total Products</h2>
          <p className="text-2xl font-bold text-brand-orange">{totalProducts}</p>
          <Link href="/admin/products" className="text-brand-orange hover:underline">
            Manage Products
          </Link>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-md">
          <h2 className="text-xl font-semibold">Categories</h2>
          <p className="text-2xl font-bold text-brand-orange">{CATEGORIES.length}</p>
          <ul className="mt-2 text-sm text-gray-600">
            {byCategory.map((c) => (
              <li key={c.slug}>
                {c.name}: {c.count}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-md">
          <h2 className="text-xl font-semibold">Total Orders</h2>
          <p className="text-2xl font-bold text-brand-orange">{totalOrders}</p>
          <p className="text-sm text-gray-600">
            {pendingOrders === "—" ? "Orders are saved on customers' devices until the database is connected." : `${pendingOrders} pending`}
          </p>
          <Link href="/admin/orders" className="text-brand-orange hover:underline">
            Manage Orders
          </Link>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-md">
          <h2 className="text-xl font-semibold">Total Users</h2>
          <p className="text-2xl font-bold text-brand-orange">{totalUsers}</p>
          <Link href="/admin/users" className="text-brand-orange hover:underline">
            Manage Users
          </Link>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-md">
          <h2 className="text-xl font-semibold">Total Revenue</h2>
          <p className="text-2xl font-bold text-brand-orange">{revenue}</p>
          <p className="text-sm text-gray-600">
            Hero products show &ldquo;WhatsApp for price&rdquo; until a PKR price is set.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 font-display text-2xl font-bold">What still needs Zain</h2>
        <ul className="list-disc space-y-1 pl-5 text-gray-700">
          <li>PKR price list for the {PRODUCTS.length} hero products (site shows &ldquo;WhatsApp for price&rdquo; until then).</li>
          <li>Delivery charges by city.</li>
          <li>
            The other 12 products (URPIN earbuds, OX-PD11/12/13, DV-2106,
            219MINI, Portable Music, WS01/WS02, Ultra-2 BIG) are added by Zain
            himself from the admin panel — Earbuds, Fast Chargers
            and Handsfree are empty until then, and show a clean
            &ldquo;Coming soon&rdquo; state.
          </li>
        </ul>
      </div>
    </div>
  );
}
