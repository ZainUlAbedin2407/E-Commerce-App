"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/products";
import { btnGhost, cardCls, Notice } from "@/components/AdminUI";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
];

function rangeDates(key) {
  const now = new Date();
  if (key === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString() };
  }
  const from = new Date(now);
  from.setDate(from.getDate() - Number(key));
  return { from: from.toISOString(), to: now.toISOString() };
}

export default function AdminHomePage() {
  const [range, setRange] = useState("7");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notConfigured, setNotConfigured] = useState(false);

  const load = useCallback(() => {
    setError("");
    setNotConfigured(false);
    setLoading(true);
    const { from, to } = rangeDates(range);
    const qs = new URLSearchParams({ from });
    if (to) qs.set("to", to);
    fetch(`/api/admin/stats?${qs}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          if (data.code === "db_not_configured") setNotConfigured(true);
          else setError(data.error || "Could not load stats.");
          setStats(null);
          return;
        }
        setStats(data);
      })
      .catch(() => setError("Could not load stats. Check your connection."))
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(load, [load]);

  const revenue = stats?.revenue ?? stats?.totalRevenuePKR ?? null;
  const rangeLabel = RANGES.find((r) => r.key === range)?.label || "";

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-ink">Admin Dashboard</h1>
        <div className="flex gap-2" role="group" aria-label="Stats period">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`min-h-11 cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold ${
                range === r.key
                  ? "bg-battery text-canvas"
                  : "border border-line bg-raised text-ink hover:border-battery"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-6 text-sm text-muted">
        AI Communication. Revenue below is for the selected period. Order and
        stock counts are current totals from the database.
      </p>

      {notConfigured && (
        <div className={`${cardCls} mb-6 text-center`}>
          <p className="mb-2 font-display text-lg font-semibold text-ink">Database not connected</p>
          <p className="text-sm text-muted">
            Set MONGODB_URI in Vercel settings (or .env.local for local dev),
            then redeploy. The shop keeps serving the launch catalogue meanwhile.
          </p>
        </div>
      )}
      <Notice kind="error">{error}</Notice>
      {error && (
        <button type="button" onClick={load} className={`${btnGhost} mb-6`}>
          Retry
        </button>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" aria-label="Loading stats" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={cardCls}>
              <p className="text-sm font-semibold text-muted">Orders (all time)</p>
              <p className="mt-1 font-display text-3xl font-bold text-ink">{stats.totalOrders ?? 0}</p>
              <p className="mt-1 text-sm text-muted">{stats.pendingOrders ?? 0} still pending</p>
            </div>
            <div className={cardCls}>
              <p className="text-sm font-semibold text-muted">Revenue ({rangeLabel.toLowerCase()})</p>
              <p className="mt-1 font-display text-3xl font-bold text-battery">
                {revenue != null ? formatPrice(revenue) : "Rs 0"}
              </p>
              <p className="mt-1 text-sm text-muted">
                Paid orders, plus delivered cash on delivery orders.
              </p>
            </div>
            <div className={cardCls}>
              <p className="text-sm font-semibold text-muted">Unfulfilled orders</p>
              <p className="mt-1 font-display text-3xl font-bold text-ink">{stats.unfulfilled ?? 0}</p>
              <p className="mt-1 text-sm text-muted">
                Orders not yet delivered or cancelled.
              </p>
            </div>
            <div className={cardCls}>
              <p className="text-sm font-semibold text-muted">Pending reviews</p>
              <p className="mt-1 font-display text-3xl font-bold text-ink">{stats.pendingReviews ?? 0}</p>
              <p className="mt-1 text-sm text-muted">Waiting for approval in the queue.</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={cardCls}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-semibold text-ink">
                  Low stock ({stats.lowStock ?? 0})
                </h2>
                <Link href="/admin/products" className="font-semibold text-battery hover:underline">
                  All products
                </Link>
              </div>
              {stats.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                <ul className="space-y-2">
                  {stats.lowStockProducts.map((p) => (
                    <li key={p.slug} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-raised px-3 py-2 text-sm">
                      <span className="min-w-0 flex-1 truncate text-ink">{p.name}</span>
                      <span className="shrink-0 font-semibold text-danger">
                        {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                        {p.lowStockThreshold != null ? ` (alert at ${p.lowStockThreshold})` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No product is at or below its low stock alert level.</p>
              )}
            </div>

            <div className={cardCls}>
              <h2 className="mb-3 font-display text-xl font-semibold text-ink">Quick links</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { href: "/admin/orders", label: "Orders", desc: "Process new orders" },
                  { href: "/admin/products", label: "Products", desc: "Prices, stock, photos" },
                  { href: "/admin/reviews", label: "Reviews", desc: "Approve customer reviews" },
                  { href: "/admin/draft-orders", label: "New draft order", desc: "Order for a phone customer" },
                  { href: "/admin/storefront", label: "Storefront", desc: "Homepage sections" },
                  { href: "/admin/settings", label: "Settings", desc: "Shop, delivery, payments" },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="min-h-11 rounded-xl border border-line bg-raised p-3 hover:border-battery"
                  >
                    <span className="block font-semibold text-ink">{l.label}</span>
                    <span className="block text-xs text-muted">{l.desc}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
