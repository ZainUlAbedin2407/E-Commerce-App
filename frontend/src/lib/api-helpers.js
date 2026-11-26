import { NextResponse } from "next/server";

export const json = (data, status = 200) => NextResponse.json(data, { status });

export const jsonError = (message, status = 400, extra = {}) =>
  NextResponse.json({ error: message, ...extra }, { status });

// Thrown by handlers that need the database when it is not configured.
// The client treats 503 + error code "db_not_configured" as "keep the
// Phase 1 local flow" — it is never a crash and never a fake success.
export function dbNotConfiguredError() {
  return jsonError("Database not configured. Set MONGODB_URI to enable this.", 503, {
    code: "db_not_configured",
  });
}

export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const PAK_PHONE = /^03\d{2}-?\d{7}$/;

// Prefilled WhatsApp message for an order (used by the API response and by
// the order-confirmation page). Prices are only mentioned when they exist.
export function whatsappOrderText(order) {
  const items = order.items
    .map((i) => `${i.name} x${i.qty}`)
    .join(", ");
  const total =
    order.totalPKR != null
      ? ` Total: Rs. ${Number(order.totalPKR).toLocaleString("en-PK")}.`
      : " Price aur delivery charges confirm kar dein.";
  return (
    `Assalam-o-Alaikum AI Communication! Maine order ${order.orderNo} place kiya hai (COD). ` +
    `Items: ${items}.${total} Name: ${order.customer.name}, ${order.customer.city}.`
  );
}

export function whatsappLinkForOrder(order) {
  return `https://wa.me/923355186552?text=${encodeURIComponent(whatsappOrderText(order))}`;
}
