"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProduct } from "./products";

const CartContext = createContext(null);
const CART_KEY = "ai-cart-v1";
const ORDERS_KEY = "ai-orders-v1";

// Cart items store a small product snapshot ({ id, slug, name, brand,
// model, images, pricePKR, weightKg }) alongside slug + qty. That is what makes the
// cart work for products added later in the admin panel: they are not in
// the Phase 1 seed, so a seed-only lookup would drop them. Legacy items
// without a snapshot still resolve through the seed.
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((i) => i && i.slug && Number(i.qty) > 0)
      : [];
  } catch {
    return [];
  }
}

export function loadOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOrder(order) {
  const orders = loadOrders();
  orders.unshift(order);
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // storage full / unavailable, order still shown on the confirmation page
  }
  return order;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  // The cart drawer is owned by the cart itself, so Add to Cart can open
  // it from any page. The Navbar and BottomNav render CartDrawer with
  // their own local flag; CartDrawer also listens to this flag, so the
  // drawer slides in on add-to-cart without touching those files.
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }, [items, loaded]);

  const value = useMemo(() => {
    const detailed = items
      .map((i) => ({ ...i, product: i.product || getProduct(i.slug) }))
      .filter((i) => i.product);
    const count = detailed.reduce((sum, i) => sum + i.qty, 0);
    return {
      items: detailed,
      count,
      drawerOpen,
      openCart() {
        setDrawerOpen(true);
      },
      closeCart() {
        setDrawerOpen(false);
      },
      addToCart(slug, qty = 1, snapshot) {
        setItems((prev) => {
          const found = prev.find((i) => i.slug === slug);
          if (found) {
            return prev.map((i) => (i.slug === slug ? { ...i, qty: i.qty + qty } : i));
          }
          return [...prev, { slug, qty, product: snapshot || null }];
        });
        setDrawerOpen(true);
      },
      setQty(slug, qty) {
        setItems((prev) =>
          qty <= 0
            ? prev.filter((i) => i.slug !== slug)
            : prev.map((i) => (i.slug === slug ? { ...i, qty } : i))
        );
      },
      removeFromCart(slug) {
        setItems((prev) => prev.filter((i) => i.slug !== slug));
      },
      clearCart() {
        setItems([]);
      },
      async refreshPrices() {
        // Re-read live prices from the catalogue so the cart never shows
        // a stale price (audit M5). A failed refresh keeps the stored
        // snapshot, the cart still works.
        try {
          const res = await fetch("/api/products?limit=100");
          if (!res.ok) return;
          const data = await res.json().catch(() => ({}));
          const bySlug = new Map(
            (data.products || []).map((p) => [p.slug, p])
          );
          setItems((prev) =>
            prev.map((i) => {
              const live = bySlug.get(i.slug);
              if (!live) return i;
              return {
                ...i,
                product: {
                  ...(i.product || {}),
                  name: live.name,
                  brand: live.brand,
                  model: live.model,
                  images: live.images,
                  pricePKR: live.pricePKR ?? null,
                  weightKg: live.weightKg ?? null,
                  stock: live.stock ?? null,
                },
              };
            })
          );
        } catch {
          // keep the stored snapshot
        }
      },
    };
  }, [items, drawerOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
