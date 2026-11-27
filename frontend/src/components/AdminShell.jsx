"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FaBars,
  FaBoxOpen,
  FaClipboardList,
  FaCog,
  FaFileInvoice,
  FaFilter,
  FaStar,
  FaStore,
  FaTachometerAlt,
  FaTags,
  FaThLarge,
  FaTrademark,
  FaUser,
} from "react-icons/fa";
import { MdClose } from "react-icons/md";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: FaTachometerAlt },
  { href: "/admin/storefront", label: "Storefront", icon: FaThLarge },
  { href: "/admin/products", label: "Products", icon: FaBoxOpen },
  { href: "/admin/collections", label: "Collections", icon: FaTags },
  { href: "/admin/brands", label: "Brands", icon: FaTrademark },
  { href: "/admin/filters", label: "Filters", icon: FaFilter },
  { href: "/admin/orders", label: "Orders", icon: FaClipboardList },
  { href: "/admin/draft-orders", label: "Draft orders", icon: FaFileInvoice },
  { href: "/admin/reviews", label: "Reviews", icon: FaStar },
  { href: "/admin/settings", label: "Settings", icon: FaCog },
  { href: "/admin/users", label: "Users", icon: FaUser },
  { href: "/", label: "Shop", icon: FaStore },
];

export default function AdminShell({ children, dbConfigured }) {
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="relative flex min-h-screen flex-col md:flex-row">
      <div className="z-20 flex bg-surface p-4 text-ink md:hidden">
        <button onClick={() => setIsSideBarOpen(true)} aria-label="Open admin menu">
          <FaBars size={24} />
        </button>
        <h1 className="ml-4 font-display text-xl font-medium">Admin Dashboard</h1>
      </div>

      {isSideBarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/50 md:hidden"
          onClick={() => setIsSideBarOpen(false)}
        />
      )}

      <div
        className={`absolute z-20 min-h-screen w-64 transform bg-surface text-ink transition-transform duration-300 md:relative md:translate-x-0 ${
          isSideBarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="mb-6 flex justify-between">
            <Link href="/admin" className="font-display text-xl font-bold uppercase">
              AI <span className="text-battery">Communication</span>
            </Link>
            <button
              onClick={() => setIsSideBarOpen(false)}
              className="text-2xl font-bold md:hidden"
              aria-label="Close admin menu"
            >
              <MdClose />
            </button>
          </div>
          <h2 className="mb-6 text-center text-xl font-medium">Admin Dashboard</h2>
          <nav className="flex flex-col space-y-2">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsSideBarOpen(false)}
                  className={`flex items-center space-x-2 rounded px-4 py-3 ${
                    active
                      ? "bg-battery text-canvas"
                      : "text-muted hover:bg-raised hover:text-ink"
                  }`}
                >
                  <Icon />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
          {dbConfigured ? (
            <button
              onClick={handleLogout}
              className="mt-6 w-full cursor-pointer rounded bg-ink/10 px-4 py-2 text-sm font-semibold text-ink hover:bg-ink/20"
            >
              Logout
            </button>
          ) : (
            <p className="mt-6 rounded bg-ink/10 p-3 text-xs text-muted">
              Database not connected. Showing the launch catalogue. Sign-in and
              saving are disabled until the database is configured.
            </p>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-grow overflow-auto bg-canvas p-6">{children}</div>
    </div>
  );
}
