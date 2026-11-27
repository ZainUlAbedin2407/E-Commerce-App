"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineHome,
  HiOutlineShoppingBag,
  HiOutlineUser,
} from "react-icons/hi2";
import SearchBar from "./SearchBar";
import CartDrawer from "./CartDrawer";
import { useCart } from "@/lib/cart-context";

// Bottom thumb bar, mobile only (below the md breakpoint). Four items:
// Home, Search, Cart, Account. Every tap target is at least 48px.
// Search reuses the existing SearchBar overlay; Cart reuses the
// existing CartDrawer. The shop layout adds bottom padding on mobile
// so this bar never covers content.
const SEARCH_SLOT =
  "[&_svg]:text-ink [&_button:hover]:bg-raised [&_button]:rounded-lg";

export default function BottomNav() {
  const { count } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [me, setMe] = useState(null);

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

  return (
    <>
      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-line bg-surface md:hidden"
      >
        <Link
          href="/"
          className="flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 text-ink hover:text-battery"
        >
          <HiOutlineHome className="h-6 w-6" />
          <span className="text-[11px] font-semibold">Home</span>
        </Link>
        <div className="flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 text-ink">
          <span className={SEARCH_SLOT}>
            <SearchBar />
          </span>
          <span className="text-[11px] font-semibold">Search</span>
        </div>
        <button
          onClick={() => setCartOpen(true)}
          aria-label={count > 0 ? `Open cart, ${count} items` : "Open cart"}
          className="relative flex min-h-12 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-ink hover:text-battery"
        >
          <span className="relative">
            <HiOutlineShoppingBag className="h-6 w-6" />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-battery px-1 text-[11px] font-bold text-canvas">
                {count}
              </span>
            )}
          </span>
          <span className="text-[11px] font-semibold">Cart</span>
        </button>
        <Link
          href={me ? "/profile" : "/login"}
          className="relative flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 text-ink hover:text-battery"
        >
          <span className="relative">
            <HiOutlineUser className="h-6 w-6" />
            {me && (
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-battery"
              />
            )}
          </span>
          <span className="text-[11px] font-semibold">Account</span>
        </Link>
      </nav>

      <CartDrawer drawerOpen={cartOpen} toggleCartDrawer={() => setCartOpen(false)} />
    </>
  );
}
