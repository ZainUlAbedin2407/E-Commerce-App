// AI Communication — shared business facts.
// Locked facts only. Nothing here is invented. Prices live on the
// products themselves (admin-changeable); every product on the site
// must carry a real price, there is no "WhatsApp for price".
export const SHOP_NAME = "AI Communication";
export const SHOP_TAGLINE = "Smart Gadgets & Gear";
export const SHOP_ADDRESS = "Shahjahan Electronics Market, Saddar, Karachi";
export const WHATSAPP_NUMBER = "0335-5186552";
// International format for wa.me links (Pakistan +92, drop the leading 0).
export const WHATSAPP_INTL = "923355186552";

export function whatsappLink(message) {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${WHATSAPP_INTL}${text}`;
}

// WhatsApp is contact only. There is no WhatsApp ordering: orders are
// placed on the website, and the number above is for questions about
// an order, returns, or the shop.

// Pakistani mobile numbers: 03XX-XXXXXXX (dash optional). The single
// shared definition — the checkout form, the server validation and the
// API helpers all use this one, so the rule can never drift (audit L10).
export const PAK_PHONE = /^03\d{2}-?\d{7}$/;

// --- Delivery (Zain, 26 Nov 2026) ---
// Karachi Rs 250 flat, rest of Pakistan Rs 300 flat, up to 1 kg;
// +Rs 70 per additional kg. The fee is computed on the site from the
// city and the product weight, and shown before payment.
export const DELIVERY_KARACHI_PKR = 250;
export const DELIVERY_OTHER_PKR = 300;
export const DELIVERY_FREE_UP_TO_KG = 1;
export const DELIVERY_EXTRA_KG_PKR = 70;

// --- Payment (Zain, 26 Nov 2026; V3 plan §5.2) ---
// COD only for orders up to this total; above it the customer pays 100%
// advance via the website (bank transfer, JazzCash, Easypaisa, or Raast).
// The account details are entered by Zain in admin settings and shown
// only after an order is placed, never on a public page.
// Zain's rule is Rs 2,000 — he is choosing between 2,000 and 5,000;
// this constant is the single place to change it. COD is kept only
// until the advance-payment flow is running, then it is retired.
export const COD_MAX_TOTAL_PKR = 2000;

// --- Socials (real, Zain 26 Nov 2026) ---
export const SOCIALS = {
  instagram: "https://instagram.com/aicommunicationkhi",
  facebook: "https://facebook.com/aicommunicationkhi",
  tiktok: "https://tiktok.com/@aicommunicationkhi",
  whatsappCommunity: "https://chat.whatsapp.com/JEAoXmegXXtBcERB0ARNEb",
};

// Delivery fee by city. When the total weight is known (every item has
// weightKg) the +Rs 70 per additional kg applies; otherwise the flat
// base fee applies.
export function isKarachi(city) {
  return /karachi/i.test(city || "");
}

export function deliveryFeePKR(city, totalWeightKg) {
  const base = isKarachi(city) ? DELIVERY_KARACHI_PKR : DELIVERY_OTHER_PKR;
  if (totalWeightKg == null) return base;
  const extraKg = Math.max(0, Math.ceil(totalWeightKg) - DELIVERY_FREE_UP_TO_KG);
  return base + extraKg * DELIVERY_EXTRA_KG_PKR;
}
