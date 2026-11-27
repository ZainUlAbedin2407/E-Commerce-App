import Image from "next/image";
import Link from "next/link";
import { SHOP_ADDRESS, WHATSAPP_NUMBER } from "@/lib/site";

export const metadata = {
  title: "About, AI Communication | Saddar, Karachi",
  description:
    "AI Communication, a mobile accessories shop in Shahjahan Electronics Market, Saddar, Karachi. Earbuds, smartwatches, power banks, speakers and fast chargers, with delivery across Pakistan.",
};

// The cream banner is used here, and only here, as the shop story image.
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-12">
      <h1 className="font-display text-3xl font-bold text-ink">About AI Communication</h1>
      <div className="mt-6 overflow-hidden rounded-2xl border border-line">
        <Image
          src="/brand-banner.jpg"
          alt="AI Communication, Smart Gadgets and Gear, Shahjahan Electronics Market, Saddar, Karachi"
          width={1344}
          height={756}
          className="aspect-[16/9] w-full object-cover"
        />
      </div>
      <section className="mt-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">The shop in Saddar</h2>
        <p className="text-muted">
          AI Communication is a mobile accessories shop in {SHOP_ADDRESS}.
          We sell earbuds, smartwatches, power banks, speakers, fast chargers
          and handsfree, original products in sealed packs, at real prices
          shown on the website. Orders are placed on the website and delivered
          across Pakistan.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">Wholesale-market roots</h2>
        <p className="text-muted">
          The shop grew out of the wholesale market in Saddar. The owner runs
          the online side, and his brother-in-law runs a wholesale
          mobile-accessories shop in the same market. That is why the stock is
          real shop stock, and why every product is tested and checked before
          it is dispatched.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">How we work</h2>
        <p className="text-muted">
          Every product carries a checking warranty. Some items carry a 3 or 6
          month warranty, with home pickup and a repaired return to your
          doorstep. Delivery is Karachi Rs 250, rest of Pakistan Rs 300 up to
          1 kg, plus Rs 70 per extra kg. COD is available for orders up to
          Rs 2,000, above that orders are paid 100 percent in advance on the
          website.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/collections/all"
            className="press inline-flex min-h-12 items-center justify-center rounded-full bg-battery px-8 py-3 font-semibold text-canvas hover:bg-battery-deep"
          >
            Shop products
          </Link>
          <Link
            href="/contact"
            className="press inline-flex min-h-12 items-center justify-center rounded-full border border-ink/60 px-8 py-3 font-semibold text-ink hover:border-ink"
          >
            Contact us
          </Link>
        </div>
      </section>
      <p className="mt-8 text-sm text-muted">
        WhatsApp (contact only): {WHATSAPP_NUMBER}
      </p>
    </div>
  );
}
