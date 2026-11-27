"use client";

import { useEffect, useState } from "react";
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import {
  WHATSAPP_NUMBER,
  SOCIALS,
  whatsappLink,
  DELIVERY_KARACHI_PKR,
  DELIVERY_OTHER_PKR,
} from "@/lib/site";
import { formatPrice } from "@/lib/products";

// Announcement bar. It sits above the sticky header, so it scrolls away.
// It fetches GET /api/settings/public and shows the announcement text
// when one is active. If the fetch fails or there is no active
// announcement, it falls back to the real delivery fact. Nothing here
// promises free delivery or any other offer.
const FALLBACK_TEXT = `Delivery across Pakistan. Karachi ${formatPrice(
  DELIVERY_KARACHI_PKR
)}, rest of Pakistan ${formatPrice(DELIVERY_OTHER_PKR)}.`;

export default function Topbar() {
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const a = data?.announcement;
        if (a?.active && a?.text) setAnnouncement(a);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const text = announcement?.text || FALLBACK_TEXT;
  const link = announcement?.link || null;
  const message = link ? (
    <a href={link} className="font-semibold underline underline-offset-2">
      {text}
    </a>
  ) : (
    text
  );

  return (
    <div className="bg-battery text-canvas">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-2">
        <div className="hidden items-center gap-4 md:flex">
          <a
            href={SOCIALS.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="transition-opacity hover:opacity-70"
          >
            <FaFacebookF className="h-4 w-4" />
          </a>
          <a
            href={SOCIALS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="transition-opacity hover:opacity-70"
          >
            <FaInstagram className="h-4 w-4" />
          </a>
          <a
            href={SOCIALS.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="transition-opacity hover:opacity-70"
          >
            <FaTiktok className="h-4 w-4" />
          </a>
        </div>
        <p className="flex-grow text-center text-sm font-medium">{message}</p>
        <a
          href={whatsappLink("Assalam-o-Alaikum AI Communication!")}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70 md:flex"
        >
          <FaWhatsapp className="h-4 w-4" />
          WhatsApp {WHATSAPP_NUMBER}
        </a>
      </div>
    </div>
  );
}
