"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaBars, FaBoxOpen, FaClipboardList, FaStore, FaUser } from "react-icons/fa";
import { MdClose } from "react-icons/md";

const NAV = [
  { href: "/admin/users", label: "Users", icon: FaUser },
  { href: "/admin/products", label: "Products", icon: FaBoxOpen },
  { href: "/admin/orders", label: "Orders", icon: FaClipboardList },
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
      <div className="z-20 flex bg-brand-charcoal p-4 text-white md:hidden">
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
        className={`absolute z-20 min-h-screen w-64 transform bg-brand-charcoal text-white transition-transform duration-300 md:relative md:translate-x-0 ${
          isSideBarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="mb-6 flex justify-between">
            <Link href="/admin" className="font-display text-xl font-bold uppercase">
              AI <span className="text-brand-orange">Communication</span>
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
                      ? "bg-brand-orange text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
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
              className="mt-6 w-full cursor-pointer rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              Logout
            </button>
          ) : (
            <p className="mt-6 rounded bg-white/10 p-3 text-xs text-gray-300">
              Database not connected — showing the launch catalogue. Sign-in and
              saving are disabled until the database is configured.
            </p>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-grow overflow-auto bg-brand-paper p-6">{children}</div>
    </div>
  );
}
