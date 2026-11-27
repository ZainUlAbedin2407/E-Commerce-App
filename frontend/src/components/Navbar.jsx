"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiBars3BottomRight,
  HiChevronDown,
} from "react-icons/hi2";
import { IoMdClose } from "react-icons/io";
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import SearchBar from "./SearchBar";
import CartDrawer from "./CartDrawer";
import { useCart } from "@/lib/cart-context";
import { CATEGORIES } from "@/lib/products";
import { SOCIALS, SHOP_ADDRESS, WHATSAPP_NUMBER, whatsappLink } from "@/lib/site";

// SearchBar is owned by Wave 2 and still renders its own light-styled
// button. This wrapper keeps its magnifier visible on the dark header
// until Wave 2 restyles it.
const SEARCH_SLOT =
  "[&_svg]:text-ink [&_button:hover]:bg-raised [&_button]:rounded-lg";

export default function Navbar() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [me, setMe] = useState(null);
  const [tiles, setTiles] = useState(null);
  const { count } = useCart();
  const closeTimer = useRef(null);

  // Who is signed in? 401/503 (guest / DB not connected) just means the
  // guest links stay as they are. Nothing breaks.
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

  // Category tiles with cover photos for the mega menu. Falls back to the
  // seed categories (no covers) when the API is unreachable.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.categories) setTiles(data.categories);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Escape closes the mega menu, the account menu and the mobile drawer.
  useEffect(() => {
    if (!megaOpen && !accountOpen && !navDrawerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMegaOpen(false);
        setAccountOpen(false);
        setNavDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [megaOpen, accountOpen, navDrawerOpen]);

  // Close the mega menu 150ms after the pointer leaves, so moving from
  // the button to the panel (across the padded hover bridge) never
  // closes it. Entering again cancels the pending close.
  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const scheduleCloseMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMegaOpen(false), 150);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setMe(null);
    setAccountOpen(false);
    setNavDrawerOpen(false);
    router.push("/");
    router.refresh();
  };

  const categories = tiles || CATEGORIES.map((c) => ({ ...c, cover: "", count: null }));

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-canvas">
        <nav className="container mx-auto flex h-14 items-center justify-between gap-2 px-4 md:h-16 md:px-6">
          <Link href="/" className="flex min-h-12 items-center gap-2.5" aria-label="AI Communication, home">
            <Image
              src="/logo-ai-dark.png"
              alt="AI Communication"
              width={503}
              height={337}
              className="h-10 w-auto md:h-12"
              priority
            />
            <span className="hidden font-display text-lg font-extrabold uppercase leading-tight tracking-wide text-ink sm:block">
              <span className="text-battery">Communication</span>
              <span className="block text-[10px] font-semibold tracking-[0.18em] text-muted">
                Smart Gadgets &amp; Gear
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <div
              className="relative"
              onMouseEnter={openMega}
              onMouseLeave={scheduleCloseMega}
            >
              <button
                onClick={() => setMegaOpen((v) => !v)}
                aria-expanded={megaOpen}
                aria-label="Shop by category"
                className="press flex min-h-12 cursor-pointer items-center gap-1 rounded-lg px-3 text-sm font-semibold uppercase text-ink hover:text-battery"
              >
                Shop
                <HiChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${megaOpen ? "rotate-180" : ""}`}
                />
              </button>
              {megaOpen && (
                <div className="absolute left-1/2 top-full z-50 w-[36rem] -translate-x-1/2 pt-3">
                  <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-surface p-4 shadow-xl">
                    {categories.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/collections/${c.slug}`}
                        onClick={() => setMegaOpen(false)}
                        className="group flex items-center gap-3 rounded-xl p-2 hover:bg-raised"
                      >
                        {c.cover ? (
                          <Image
                            src={c.cover}
                            alt=""
                            width={64}
                            height={64}
                            className="h-16 w-16 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-raised font-display text-lg font-extrabold text-battery">
                            {c.name.slice(0, 1)}
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block font-display text-sm font-bold uppercase text-ink group-hover:text-battery">
                            {c.name}
                          </span>
                          <span className="block text-xs text-muted">
                            {c.count != null
                              ? `${c.count} product${c.count === 1 ? "" : "s"}`
                              : c.blurb}
                          </span>
                        </span>
                      </Link>
                    ))}
                    <Link
                      href="/collections/all"
                      onClick={() => setMegaOpen(false)}
                      className="press col-span-2 rounded-xl bg-battery px-4 py-3 text-center font-display text-sm font-bold uppercase tracking-wide text-canvas hover:bg-battery-deep"
                    >
                      View all products
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Link
              href="/collections/all"
              className="flex min-h-12 items-center rounded-lg px-3 text-sm font-semibold uppercase text-ink hover:text-battery"
            >
              All Products
            </Link>
            <Link
              href="/brands"
              className="hidden items-center rounded-lg px-3 text-sm font-semibold uppercase text-ink hover:text-battery lg:flex min-h-12"
            >
              Brands
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <span className={SEARCH_SLOT}>
              <SearchBar />
            </span>
            <div className="relative">
              <button
                onClick={() => setAccountOpen((v) => !v)}
                aria-expanded={accountOpen}
                aria-label={me ? "Account menu" : "Sign in"}
                className="relative flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-lg text-ink hover:bg-raised"
              >
                <HiOutlineUser className="h-6 w-6" />
                {me && (
                  <span
                    aria-hidden="true"
                    className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-battery"
                  />
                )}
              </button>
              {accountOpen && (
                <>
                  <button
                    aria-label="Close account menu"
                    onClick={() => setAccountOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-line bg-surface p-2 shadow-xl">
                    {me ? (
                      <>
                        <Link
                          href="/my-orders"
                          onClick={() => setAccountOpen(false)}
                          className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-raised"
                        >
                          My Orders
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setAccountOpen(false)}
                          className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-raised"
                        >
                          Profile
                        </Link>
                        {me.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setAccountOpen(false)}
                            className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-raised"
                          >
                            Admin
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="block w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-raised"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setAccountOpen(false)}
                          className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-raised"
                        >
                          Sign in
                        </Link>
                        <Link
                          href="/register"
                          onClick={() => setAccountOpen(false)}
                          className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-raised"
                        >
                          Create account
                        </Link>
                        <Link
                          href="/track"
                          onClick={() => setAccountOpen(false)}
                          className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-raised"
                        >
                          Track order
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label={count > 0 ? `Open cart, ${count} items` : "Open cart"}
              className="press relative flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-full bg-battery text-canvas hover:bg-battery-deep"
            >
              <HiOutlineShoppingBag className="h-6 w-6" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-bold text-canvas">
                  {count}
                </span>
              )}
            </button>
            <button
              className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-lg text-ink hover:bg-raised md:hidden"
              onClick={() => setNavDrawerOpen(true)}
              aria-label="Open menu"
            >
              <HiBars3BottomRight className="h-6 w-6" />
            </button>
          </div>
        </nav>
      </header>

      <CartDrawer drawerOpen={drawerOpen} toggleCartDrawer={() => setDrawerOpen(false)} />

      {navDrawerOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setNavDrawerOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-black/60 md:hidden"
        />
      )}
      <div
        className={`drawer-slide fixed left-0 top-0 z-50 flex h-full w-[85%] max-w-sm flex-col overflow-y-auto border-r border-line bg-canvas shadow-xl md:hidden ${
          navDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!navDrawerOpen}
      >
        <div className="flex items-center justify-between border-b border-line p-4">
          <Link
            href="/"
            onClick={() => setNavDrawerOpen(false)}
            className="flex items-center gap-2"
          >
            <Image
              src="/logo-ai-dark.png"
              alt="AI Communication"
              width={503}
              height={337}
              className="h-8 w-auto"
            />
          </Link>
          <button
            onClick={() => setNavDrawerOpen(false)}
            aria-label="Close menu"
            className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-lg text-ink hover:bg-raised"
          >
            <IoMdClose className="h-6 w-6" />
          </button>
        </div>
        <div className="flex items-center gap-2 border-b border-line p-4">
          <span className={SEARCH_SLOT}>
            <SearchBar />
          </span>
          <span className="text-sm font-semibold text-ink">Search products</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <Link
            href="/collections/all"
            onClick={() => setNavDrawerOpen(false)}
            className="block rounded-lg px-3 py-3 text-base font-semibold text-ink hover:bg-raised"
          >
            All Products
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              onClick={() => setNavDrawerOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-3 text-base font-semibold text-ink hover:bg-raised"
            >
              {c.name}
              {c.count != null && (
                <span className="text-sm font-medium text-muted">{c.count}</span>
              )}
            </Link>
          ))}
          <Link
            href="/brands"
            onClick={() => setNavDrawerOpen(false)}
            className="block rounded-lg px-3 py-3 text-base font-semibold text-ink hover:bg-raised"
          >
            Brands
          </Link>
          <Link
            href="/reviews"
            onClick={() => setNavDrawerOpen(false)}
            className="block rounded-lg px-3 py-3 text-base font-semibold text-ink hover:bg-raised"
          >
            Reviews
          </Link>
          <Link
            href="/track"
            onClick={() => setNavDrawerOpen(false)}
            className="block rounded-lg px-3 py-3 text-base font-semibold text-ink hover:bg-raised"
          >
            Track Order
          </Link>
          {me ? (
            <>
              <Link
                href="/my-orders"
                onClick={() => setNavDrawerOpen(false)}
                className="block rounded-lg px-3 py-3 text-base font-semibold text-ink hover:bg-raised"
              >
                My Orders
              </Link>
              <Link
                href="/profile"
                onClick={() => setNavDrawerOpen(false)}
                className="block rounded-lg px-3 py-3 text-base font-semibold text-ink hover:bg-raised"
              >
                Profile
              </Link>
              {me.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setNavDrawerOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-semibold text-battery hover:bg-raised"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="block w-full cursor-pointer rounded-lg px-3 py-3 text-left text-base font-semibold text-ink hover:bg-raised"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setNavDrawerOpen(false)}
              className="block rounded-lg px-3 py-3 text-base font-semibold text-ink hover:bg-raised"
            >
              Sign in
            </Link>
          )}
        </nav>
        <div className="border-t border-line p-4">
          <p className="text-sm text-muted">{SHOP_ADDRESS}</p>
          <a
            href={whatsappLink("Assalam-o-Alaikum AI Communication!")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex min-h-12 items-center gap-2 text-sm font-semibold text-ink hover:text-battery"
          >
            <FaWhatsapp className="h-5 w-5 text-battery" />
            WhatsApp {WHATSAPP_NUMBER}
          </a>
          <div className="mt-3 flex items-center gap-4">
            <a
              href={SOCIALS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-muted hover:text-battery"
            >
              <FaFacebookF className="h-5 w-5" />
            </a>
            <a
              href={SOCIALS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-muted hover:text-battery"
            >
              <FaInstagram className="h-5 w-5" />
            </a>
            <a
              href={SOCIALS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-muted hover:text-battery"
            >
              <FaTiktok className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
