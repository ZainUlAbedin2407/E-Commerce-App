"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { whatsappLink } from "@/lib/site";

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setMe(data?.user || null))
      .catch(() => setMe(null))
      .finally(() => setLoaded(true));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/");
    router.refresh();
  };

  if (!loaded) return <p className="p-10 text-center text-gray-500">Loading…</p>;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="container mx-auto flex-grow p-4 md:p-6">
        <div className="flex flex-col space-y-6 md:flex-row md:space-x-6 md:space-y-0">
          <div className="w-full rounded-lg bg-white p-6 shadow-md md:w-1/3 lg:w-1/4">
            <h1 className="mb-4 font-display text-2xl font-bold md:text-3xl">
              {me ? me.name : "Guest"}
            </h1>
            {me ? (
              <>
                <p className="mb-1 text-gray-600">{me.email}</p>
                {me.phone && <p className="mb-4 text-gray-600">{me.phone}</p>}
                <p className="mb-4 rounded bg-orange-50 p-3 text-sm text-gray-700">
                  Signed in as {me.role === "admin" ? "admin" : "customer"}. Your
                  orders are saved to your account and show on any device.
                </p>
                <div className="space-y-2">
                  {me.role === "admin" && (
                    <Link
                      href="/admin"
                      className="block rounded-lg bg-brand-orange px-4 py-2 text-center font-semibold text-white hover:bg-brand-orange-dark"
                    >
                      Open Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full cursor-pointer rounded-lg bg-brand-black px-4 py-2 text-center font-semibold text-white hover:bg-brand-charcoal"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-4 text-lg text-gray-600">
                  You are browsing as a guest.
                </p>
                <p className="mb-4 rounded bg-orange-50 p-3 text-sm text-gray-700">
                  Sign in to keep your orders on your account. Guests can still
                  order with Cash on Delivery — those orders are saved on this
                  device, see My Orders.
                </p>
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="block rounded-lg bg-brand-black px-4 py-2 text-center font-semibold text-white hover:bg-brand-charcoal"
                  >
                    Login
                  </Link>
                </div>
              </>
            )}
            <div className="mt-4 space-y-2">
              <Link
                href="/my-orders"
                className="block rounded-lg border border-gray-200 px-4 py-2 text-center font-semibold text-brand-black hover:border-brand-orange"
              >
                My Orders
              </Link>
              <a
                href={whatsappLink("Assalam-o-Alaikum! Mujhe apne order ke baare mein poochna hai.")}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg bg-brand-orange px-4 py-2 text-center font-semibold text-white hover:bg-brand-orange-dark"
              >
                WhatsApp Us
              </a>
            </div>
          </div>
          <div className="w-full md:w-2/3 lg:w-3/4">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-2 font-display text-xl font-bold">Your orders</h2>
              <p className="mb-4 text-gray-600">
                {me
                  ? "Orders on your account appear on the My Orders page, on any device."
                  : "Orders you place on this device appear on the My Orders page."}
              </p>
              <Link href="/my-orders" className="font-semibold text-brand-orange hover:underline">
                View My Orders →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
