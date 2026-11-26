"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HiOutlineShoppingBag, HiOutlineUser, HiBars3BottomRight } from "react-icons/hi2";
import { IoMdClose } from "react-icons/io";
import SearchBar from "./SearchBar";
import CartDrawer from "./CartDrawer";
import { useCart } from "@/lib/cart-context";
import { CATEGORIES } from "@/lib/products";

export default function Navbar() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [me, setMe] = useState(null);
  const { count } = useCart();

  // Who is signed in? 401/503 (guest / DB not connected) just means the
  // guest links stay as they are — nothing breaks.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.user) setMe(data.user);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setMe(null);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <nav className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand-banner.jpg"
            alt="AI Communication — Smart Gadgets & Gear"
            width={220}
            height={124}
            className="h-12 w-auto rounded object-cover"
            priority
          />
          <span className="hidden font-display text-xl font-bold uppercase leading-tight tracking-wide text-brand-black sm:block">
            AI <span className="text-brand-orange">Communication</span>
            <span className="block text-[10px] font-medium tracking-[0.2em] text-gray-500">
              Smart Gadgets &amp; Gear
            </span>
          </span>
        </Link>

        <div className="hidden items-center space-x-6 md:flex">
          {CATEGORIES.filter((c) => c.slug !== "handsfree").map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="text-sm font-medium uppercase text-gray-700 hover:text-brand-orange"
            >
              {c.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/admin"
            className="hidden rounded bg-brand-black px-2 py-1 text-sm text-white hover:bg-brand-charcoal md:block"
          >
            Admin
          </Link>
          {me ? (
            <span className="hidden items-center gap-2 sm:flex">
              <Link
                href="/profile"
                className="text-sm font-semibold text-gray-700 hover:text-brand-orange"
              >
                {me.name.split(" ")[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="cursor-pointer rounded border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:border-brand-orange hover:text-brand-orange"
              >
                Logout
              </button>
            </span>
          ) : (
            <Link href="/profile" aria-label="Profile" className="text-black">
              <HiOutlineUser className="h-6 w-6 text-gray-700 hover:text-brand-orange" />
            </Link>
          )}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open cart"
            className="relative cursor-pointer hover:text-black"
          >
            <HiOutlineShoppingBag className="h-6 w-6 text-gray-700" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 rounded-full bg-brand-orange px-1.5 py-0.5 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </button>
          <div className="relative">
            <SearchBar />
          </div>
          <button
            className="md:hidden"
            onClick={() => setNavDrawerOpen(true)}
            aria-label="Open menu"
          >
            <HiBars3BottomRight className="h-6 w-6 cursor-pointer text-gray-700" />
          </button>
        </div>
      </nav>

      <CartDrawer drawerOpen={drawerOpen} toggleCartDrawer={() => setDrawerOpen(false)} />

      <div
        className={`fixed left-0 top-0 z-50 h-full w-3/4 bg-white shadow-lg transition-transform duration-300 sm:w-1/2 md:w-1/3 ${
          navDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end p-4">
          <button onClick={() => setNavDrawerOpen(false)} aria-label="Close menu">
            <IoMdClose className="h-6 w-6 text-gray-600" />
          </button>
        </div>
        <div className="p-4">
          <h2 className="mb-4 text-xl font-semibold">Menu</h2>
          <nav className="space-y-4">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                onClick={() => setNavDrawerOpen(false)}
                className="block text-gray-600 hover:text-brand-orange"
              >
                {c.name}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setNavDrawerOpen(false)}
              className="block w-fit rounded bg-brand-black px-2 py-1 text-sm text-white md:hidden"
            >
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}
