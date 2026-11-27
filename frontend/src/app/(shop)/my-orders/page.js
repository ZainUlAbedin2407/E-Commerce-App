"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { loadOrders } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";
import { WHATSAPP_NUMBER, whatsappLink } from "@/lib/site";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [source, setSource] = useState("device");
  const [claimNo, setClaimNo] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimMsg, setClaimMsg] = useState("");
  const [claiming, setClaiming] = useState(false);

  const loadAccountOrders = () =>
    fetch("/api/orders/my")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.orders) {
          setOrders(data.orders.map((o) => ({ ...o, id: o.orderNo || o.id })));
          setSource("account");
          return true;
        }
        return false;
      })
      .catch(() => false);

  useEffect(() => {
    // Signed-in customers see their account orders (any device). Guests
    // and DB-not-connected setups fall back to this device's local orders.
    loadAccountOrders()
      .then((ok) => {
        if (!ok) setOrders(loadOrders());
      })
      .finally(() => setLoaded(true));
  }, []);

  // Claim a guest order (audit L4): the order number + the phone number
  // used at checkout attach it to this account.
  const handleClaim = async (e) => {
    e.preventDefault();
    setClaimMsg("");
    if (!claimNo.trim() || !claimPhone.trim()) {
      setClaimMsg("Enter the order number and the phone number you ordered with.");
      return;
    }
    setClaiming(true);
    const res = await fetch("/api/orders/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNo: claimNo.trim(), phone: claimPhone.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setClaiming(false);
    if (!res.ok) {
      setClaimMsg(data.error || "Could not claim that order.");
      return;
    }
    setClaimMsg(`Order ${data.order.orderNo} is now on your account.`);
    setClaimNo("");
    setClaimPhone("");
    await loadAccountOrders();
  };

  if (!loaded) return <p className="p-10 text-center text-muted">Loading…</p>;

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-12">
      <h1 className="mb-2 font-display text-3xl font-bold text-ink">My Orders</h1>
      <p className="mb-6 text-sm text-muted">
        {source === "account"
          ? "Orders on your account, visible on any device."
          : "Orders placed on this device. Sign in to keep them on your account."}
      </p>
      {source === "account" && (
        <form
          onSubmit={handleClaim}
          className="mb-6 rounded-2xl border border-line bg-surface p-5"
        >
          <h2 className="mb-1 font-semibold text-ink">
            Placed an order as a guest? Claim it here
          </h2>
          <p className="mb-3 text-sm text-muted">
            Enter the order number (e.g. AIC-0001) and the phone number you
            ordered with, the order moves onto your account.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={claimNo}
              onChange={(e) => setClaimNo(e.target.value)}
              className="min-h-12 flex-1 rounded-xl border border-line bg-raised p-3 text-base text-ink placeholder:text-muted"
              placeholder="Order number, e.g. AIC-0001"
            />
            <input
              type="tel"
              value={claimPhone}
              onChange={(e) => setClaimPhone(e.target.value)}
              className="min-h-12 flex-1 rounded-xl border border-line bg-raised p-3 text-base text-ink placeholder:text-muted"
              placeholder="Phone, e.g. 0335-5186552"
            />
            <button
              type="submit"
              disabled={claiming}
              className="press min-h-12 cursor-pointer rounded-full bg-battery px-6 py-2 font-semibold text-canvas hover:bg-battery-deep disabled:opacity-60"
            >
              {claiming ? "Claiming…" : "Claim order"}
            </button>
          </div>
          {claimMsg && <p className="mt-2 text-sm font-medium text-ink">{claimMsg}</p>}
        </form>
      )}
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center">
          <p className="mb-4 text-muted">You have no orders yet.</p>
          <Link
            href="/collections/all"
            className="press inline-flex min-h-12 items-center rounded-full bg-battery px-6 py-3 font-semibold text-canvas hover:bg-battery-deep"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {order.items?.[0]?.image && (
                    <Image
                      src={order.items[0].image}
                      alt={order.items[0].name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-lg bg-raised object-cover"
                    />
                  )}
                  <div>
                    <Link href={`/order/${order.id}`} className="font-semibold text-battery hover:underline">
                      Order {order.id}
                    </Link>
                    <p className="text-sm text-muted">
                      {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold text-battery">
                    {order.totalPKR != null ? formatPrice(order.totalPKR) : "Price coming soon"}
                  </p>
                  <p className="text-sm text-muted">
                    {order.status} ({order.paymentMethod === "Advance" || order.paymentMethod === "Advance payment" ? "Advance" : "COD"})
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted">
                {order.items?.length || 0} item{(order.items?.length || 0) === 1 ? "" : "s"}, deliver to {order.customer?.city}, Pakistan
              </p>
            </article>
          ))}
        </div>
      )}
      <p className="mt-6 text-sm text-muted">
        Questions about an order? Message us on WhatsApp at {WHATSAPP_NUMBER} with your order
        number:{" "}
        <a
          href={whatsappLink("Assalam-o-Alaikum! Mere order ka status bata dein.")}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-battery"
        >
          Chat on WhatsApp
        </a>
      </p>
    </div>
  );
}
