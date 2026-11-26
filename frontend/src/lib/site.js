// AI Communication — shared business facts.
// Locked facts only. Nothing here is invented; prices and delivery fees are
// intentionally absent — they are supplied by Zain (Phase 1: "WhatsApp for price").
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

export function whatsappOrderLink(productName) {
  return whatsappLink(
    `Assalam-o-Alaikum AI Communication! Mujhe ${productName} ki price aur availability bata dein.`
  );
}
