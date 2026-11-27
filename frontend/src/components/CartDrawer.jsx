"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IoMdClose } from "react-icons/io";
import CartContents from "./CartContents";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";
import {
  COD_MAX_TOTAL_PKR,
  DELIVERY_KARACHI_PKR,
  DELIVERY_OTHER_PKR,
} from "@/lib/site";

// Backdrop click-to-close plus Escape; live prices re-fetched on open;
// per-item price plus subtotal; delivery fee line. Bottom sheet on
// mobile, drawer on desktop. Opens on add-to-cart through the cart
// context flag, and through the header or bottom nav flag.
export default function CartDrawer({ drawerOpen, toggleCartDrawer }) {
  const router = useRouter();
  const { items, refreshPrices, drawerOpen: ctxOpen, closeCart } = useCart();
  const open = Boolean(drawerOpen) || ctxOpen;
  const close = () => {
    closeCart();
    if (toggleCartDrawer) toggleCartDrawer();
  };

  // Live prices on every open, a price changed in admin must not sit
  // stale in the drawer.
  useEffect(() => {
    if (open) refreshPrices();
  }, [open, refreshPrices]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCheckout = () => {
    close();
    router.push("/checkout");
  };

  const priced = items.filter(({ product }) => product.pricePKR != null);
  const allPriced = items.length > 0 && priced.length === items.length;
  const subtotal = priced.reduce(
    (s, { product, qty }) => s + product.pricePKR * qty,
    0
  );

  return (
    <>
      {open && (
        <button
          aria-label="Close cart"
          onClick={close}
          className="fixed inset-0 z-40 cursor-default bg-canvas/70"
        />
      )}
      <div
        role="dialog"
        aria-label="Your cart"
        aria-hidden={!open}
        className={`drawer-slide fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-line bg-surface shadow-2xl md:inset-x-auto md:bottom-auto md:right-0 md:top-0 md:h-full md:max-h-none md:w-[25rem] md:rounded-none md:border-l md:border-t-0 ${
          open ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-x-full md:translate-y-0"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <h2 className="font-display text-xl font-bold text-ink">Your Cart</h2>
          <button
            onClick={close}
            aria-label="Close cart"
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-muted hover:bg-raised"
          >
            <IoMdClose className="h-6 w-6 cursor-pointer" />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto px-4 pb-4">
          <CartContents />
        </div>
        <div className="border-t border-line bg-surface p-4">
          {items.length > 0 && (
            <div className="mb-3 text-sm text-muted">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-ink">
                  {allPriced ? formatPrice(subtotal) : "Price coming soon"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>
                  Karachi {formatPrice(DELIVERY_KARACHI_PKR)}, rest{" "}
                  {formatPrice(DELIVERY_OTHER_PKR)}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="press flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full bg-battery py-3 font-semibold text-canvas hover:bg-battery-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            Checkout
          </button>
          <p className="mt-2 text-center text-sm text-muted">
            COD up to {formatPrice(COD_MAX_TOTAL_PKR)}, delivery across Pakistan
          </p>
        </div>
      </div>
    </>
  );
}
