import Image from "next/image";
import Link from "next/link";
import { SHOP_ADDRESS, WHATSAPP_NUMBER, whatsappLink } from "@/lib/site";

// Fix 2026-11-26: the banner image already contains the "AI COMMUNICATION"
// text, so NO text is overlaid on top of it — the old overlay duplicated the
// banner text and the two layers collided. The banner is shown clean, and
// the headline + buttons live in the dark band underneath it.
export default function Hero() {
  return (
    <section className="w-full">
      <Image
        src="/brand-banner.jpg"
        alt="AI Communication — Smart Gadgets & Gear, Shahjahan Electronics Market, Saddar, Karachi"
        width={1344}
        height={756}
        className="h-[360px] w-full object-cover object-center md:h-[480px]"
        priority
      />
      <div className="bg-brand-charcoal px-6 py-10 text-center text-white md:py-12">
        <h1 className="mb-3 font-display text-3xl font-bold uppercase tracking-wide md:text-5xl">
          Original Accessories, Delivered Across Pakistan
        </h1>
        <p className="mb-2 text-sm tracking-[0.2em] text-brand-cream/80 md:text-base">
          EARBUDS &bull; SMARTWATCHES &bull; POWER BANKS &bull; SPEAKERS &bull; FAST CHARGERS
        </p>
        <p className="mb-6 text-sm text-brand-cream/70">{SHOP_ADDRESS}</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/collections/all"
            className="rounded bg-brand-orange px-6 py-3 text-lg font-semibold text-white transition hover:bg-brand-orange-dark"
          >
            Shop Now
          </Link>
          <a
            href={whatsappLink("Assalam-o-Alaikum AI Communication! Mujhe order karna hai.")}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-white bg-white/10 px-6 py-3 text-lg font-semibold text-white transition hover:bg-white/20"
          >
            WhatsApp {WHATSAPP_NUMBER}
          </a>
        </div>
      </div>
    </section>
  );
}
