"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/products";
import { btnGhost, cardCls, fmtDate, inputCls, Notice } from "@/components/AdminUI";

const STATUSES = ["", "Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"];

export default function OrderManagementPage() {
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = (p = 1) => {
    setError("");
    setNotConfigured(false);
    const qs = new URLSearchParams({ page: String(p), limit: "50" });
    if (search.trim()) qs.set("search", search.trim());
    if (statusFilter) qs.set("status", statusFilter);
    fetch(`/api/admin/orders?${qs}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          if (data.code === "db_not_configured") setNotConfigured(true);
          else setError(data.error || "Could not load orders.");
          setOrders([]);
          setDbConnected(false);
        } else {
          setOrders(data.orders || []);
          setPages(data.pages || 1);
          setTotal(data.total || 0);
          setPage(data.page || p);
          setDbConnected(true);
        }
      })
      .catch(() => {
        setError("Could not load orders. Check your connection.");
        setOrders([]);
        setDbConnected(false);
      })
      .finally(() => setLoaded(true));
  };

  // Search and status filter on the server; the search input is debounced.
  useEffect(() => {
    const t = setTimeout(() => load(1), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold text-ink">Orders</h2>
        <Link href="/admin/draft-orders" className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-battery px-5 py-2 font-semibold text-canvas hover:bg-battery-deep">
          New draft order
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        {dbConnected
          ? `${total} order${total === 1 ? "" : "s"} in total. Open an order to change its status, add a note, verify a payment or handle a return.`
          : notConfigured
            ? "Database not connected. Set MONGODB_URI to see every customer order here."
            : "Orders could not be loaded."}
      </p>
      {notConfigured && (
        <div className={`${cardCls} mb-4 text-center`}>
          <p className="mb-2 font-display text-lg font-semibold text-ink">Database not connected</p>
          <p className="text-sm text-muted">
            Set MONGODB_URI in Vercel settings (or .env.local for local dev),
            then redeploy. Until then, orders are only visible on the device
            that placed them.
          </p>
        </div>
      )}
      <Notice kind="error">{error}</Notice>
      {error && (
        <button type="button" onClick={() => load(page)} className={`${btnGhost} mb-4`}>
          Retry
        </button>
      )}
      {!notConfigured && !error && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputCls}
              placeholder="Search by order number, phone or name"
              aria-label="Search orders"
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls} aria-label="Filter by status">
              <option value="">All statuses</option>
              {STATUSES.filter(Boolean).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <p className="mb-3 text-xs text-muted">
            Search and status filter all orders on the server.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="min-w-full text-left text-sm text-muted">
              <thead className="whitespace-nowrap text-ink">
                <tr className="border-b border-line">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {!loaded ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center">Loading...</td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b border-line align-top last:border-0">
                      <td className="p-4 font-semibold text-ink">
                        <Link href={`/admin/orders/${order.orderNo || order.id}`} className="text-battery hover:underline">
                          {order.orderNo || order.id}
                        </Link>
                      </td>
                      <td className="p-4">
                        {order.customer?.name || "No name"}
                        <span className="block text-xs">{order.customer?.phone || ""}</span>
                      </td>
                      <td className="p-4 font-semibold text-ink">
                        {order.totalPKR != null ? formatPrice(order.totalPKR) : "No total"}
                      </td>
                      <td className="p-4">
                        {order.paymentMethod || "Not set"}
                        <span className="block text-xs">{order.paymentStatus || ""}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold ${
                            order.status === "Delivered"
                              ? "bg-success/15 text-success"
                              : order.status === "Cancelled"
                                ? "bg-danger/15 text-danger"
                                : "bg-battery/15 text-battery"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">{fmtDate(order.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="mt-4 flex items-center gap-3">
              <button type="button" disabled={page <= 1} onClick={() => load(page - 1)} className={btnGhost}>
                Previous
              </button>
              <span className="text-sm text-muted">
                Page {page} of {pages}
              </span>
              <button type="button" disabled={page >= pages} onClick={() => load(page + 1)} className={btnGhost}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
