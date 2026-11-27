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

// Stable 503 for a configured database that cannot be reached (audit H2).
// Callers must use this instead of letting a DB error become an uncaught
// Next.js 500 that the client cannot understand.
export function dbErrorResponse(err) {
  console.error("Database unavailable:", err?.message || err);
  return jsonError("Database is temporarily unavailable. Please try again.", 503, {
    code: "db_unavailable",
  });
}

// CSRF Origin check (audit M3). Returns a 403 response when a
// state-changing request carries an Origin/Referer from another site,
// otherwise null. SameSite=Lax on the auth cookie is the primary layer;
// this is defence in depth (same-site subdomains, top-level navigation).
// - No Origin/Referer at all (curl, non-browser clients) → allowed.
// - Origin/Referer present → it must match this request's own Host
//   (https or, for local dev, http) or NEXT_PUBLIC_SITE_URL.
export function sameOriginError(request) {
  const origin = request.headers.get("origin");
  let source = origin || null;
  if (!source) {
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        source = new URL(referer).origin;
      } catch {
        source = null;
      }
    }
  }
  if (!source) return null;
  const allowed = new Set();
  const host = request.headers.get("host");
  if (host) {
    allowed.add(`https://${host}`);
    allowed.add(`http://${host}`);
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      allowed.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin);
    } catch {
      // Ignore a malformed site URL — the Host check still applies.
    }
  }
  if (allowed.has(source)) return null;
  return jsonError("Request origin not allowed.", 403, { code: "csrf_origin" });
}

export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Shared with the client (checkout form) via src/lib/site.js — this
// file imports next/server, so client components cannot import it
// directly. One definition, never two (audit L10).
export { PAK_PHONE } from "./site";

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
