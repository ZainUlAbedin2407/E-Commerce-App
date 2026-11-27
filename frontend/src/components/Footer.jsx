import Image from "next/image";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { FiPhoneCall } from "react-icons/fi";
import { CATEGORIES } from "@/lib/products";
import {
  SHOP_ADDRESS,
  WHATSAPP_NUMBER,
  SOCIALS,
  whatsappLink,
  DELIVERY_KARACHI_PKR,
  DELIVERY_OTHER_PKR,
} from "@/lib/site";
import { formatPrice } from "@/lib/products";

// Footer: dark surface, the real AI mark, real socials, and the pages a
// tech store needs. WhatsApp appears as contact only, never as a way to
// order. Orders are placed on the website.
const HELP_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/shipping", label: "Shipping" },
  { href: "/returns", label: "Returns and Warranty" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/reviews", label: "Reviews" },
  { href: "/track", label: "Track Order" },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface text-ink">
      <div className="container mx-auto grid grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
        <div>
          <Link href="/" className="mb-4 flex items-center gap-2.5">
            <Image
              src="/logo-ai-dark.png"
              alt="AI Communication"
              width={503}
              height={337}
              className="h-10 w-auto"
            />
            <span className="font-display text-lg font-extrabold uppercase leading-tight tracking-wide text-ink">
              <span className="text-battery">Communication</span>
            </span>
          </Link>
          <p className="mt-2 text-sm text-muted">Smart Gadgets &amp; Gear</p>
          <p className="mt-2 text-sm text-muted">{SHOP_ADDRESS}</p>
          <p className="mt-2 text-sm text-muted">
            Mobile accessories only. Delivery across Pakistan: Karachi{" "}
            {formatPrice(DELIVERY_KARACHI_PKR)}, rest of Pakistan{" "}
            {formatPrice(DELIVERY_OTHER_PKR)}.
          </p>
        </div>

        <div>
          <h3 className="mb-4 font-display text-base font-bold uppercase tracking-wide text-ink">
            Shop
          </h3>
          <ul className="space-y-2.5 text-sm text-muted">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/collections/${c.slug}`}
                  className="transition-colors hover:text-battery"
                >
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/collections/all"
                className="transition-colors hover:text-battery"
              >
                All Products
              </Link>
            </li>
            <li>
              <Link href="/brands" className="transition-colors hover:text-battery">
                Brands
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-display text-base font-bold uppercase tracking-wide text-ink">
            Help
          </h3>
          <ul className="space-y-2.5 text-sm text-muted">
            {HELP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-battery">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-display text-base font-bold uppercase tracking-wide text-ink">
            Contact
          </h3>
          <div className="mb-5 flex items-center gap-2">
            <a
              href={SOCIALS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-muted hover:text-battery"
            >
              <FaFacebookF className="h-5 w-5" />
            </a>
            <a
              href={SOCIALS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-muted hover:text-battery"
            >
              <FaInstagram className="h-5 w-5" />
            </a>
            <a
              href={SOCIALS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-muted hover:text-battery"
            >
              <FaTiktok className="h-5 w-5" />
            </a>
            <a
              href={SOCIALS.whatsappCommunity}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Community"
              className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-muted hover:text-battery"
            >
              <FaWhatsapp className="h-5 w-5" />
            </a>
          </div>
          <p className="text-sm text-muted">Call or WhatsApp us</p>
          <p className="mt-1 text-sm">
            <FiPhoneCall className="mr-2 inline-block text-battery" />
            <a href="tel:+923355186552" className="font-semibold text-ink hover:text-battery">
              {WHATSAPP_NUMBER}
            </a>
          </p>
          <p className="mt-2 text-sm">
            <a
              href={whatsappLink("Assalam-o-Alaikum AI Communication!")}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ink hover:text-battery"
            >
              Chat with us on WhatsApp
            </a>
          </p>
          <p className="mt-2 text-sm">
            <a
              href={SOCIALS.whatsappCommunity}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-battery"
            >
              Join our WhatsApp Community
            </a>
          </p>
          <p className="mt-3 text-sm">
            <Link href="/my-orders" className="text-muted hover:text-battery">
              My Orders
            </Link>
          </p>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="container mx-auto px-4 py-6 text-center text-sm text-muted md:px-6">
          © {new Date().getFullYear()} AI Communication, Saddar, Karachi. All
          rights reserved.
        </p>
      </div>
    </footer>
  );
}
