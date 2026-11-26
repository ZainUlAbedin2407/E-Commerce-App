"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProduct } from "./products";

const CartContext = createContext(null);
const CART_KEY = "ai-cart-v1";
const ORDERS_KEY = "ai-orders-v1";

// Cart items store a small product snapshot ({ id, slug, name, brand,
// model, images, pricePKR }) alongside slug + qty. That is what makes the
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
    // storage full / unavailable — order still shown on the confirmation page
  }
  return order;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

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
      addToCart(slug, qty = 1, snapshot) {
        setItems((prev) => {
          const found = prev.find((i) => i.slug === slug);
          if (found) {
            return prev.map((i) => (i.slug === slug ? { ...i, qty: i.qty + qty } : i));
          }
          return [...prev, { slug, qty, product: snapshot || null }];
        });
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
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
