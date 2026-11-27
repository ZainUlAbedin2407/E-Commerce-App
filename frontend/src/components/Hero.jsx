import Image from "next/image";
import Link from "next/link";
import { getProduct } from "@/lib/products";
import { SHOP_ADDRESS } from "@/lib/site";
import PriceTag from "./PriceTag";

// Hero: one product, one line, one CTA. Full-bleed dark, battery-orange
// pill primary plus an outlined cream ghost secondary. The hero product
// comes from the homepage hero section; the DV-1089 is the fallback.
export default function Hero({ product }) {
  const hero = product || getProduct("dv-1089");
  if (!hero) return null;
  return (
    <section className="w-full bg-canvas">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-5 py-12 md:px-12 md:py-20 lg:grid-cols-2">
        <div className="reveal">
          <h1 className="font-display text-4xl font-extrabold leading-tight text-ink md:text-6xl">
            {hero.name}
          </h1>
          <p className="mt-4 max-w-[66ch] text-lg text-muted">{hero.shortDesc}</p>
          <div className="mt-4">
            <PriceTag product={hero} size="lg" />
          </div>
          <p className="mt-2 text-sm text-muted">{SHOP_ADDRESS}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/product/${hero.slug}`}
              className="press inline-flex min-h-12 items-center justify-center rounded-full bg-battery px-8 py-3 text-lg font-semibold text-canvas hover:bg-battery-deep"
            >
              Shop this speaker
            </Link>
            <Link
              href="/collections/all"
              className="press inline-flex min-h-12 items-center justify-center rounded-full border border-ink/60 px-8 py-3 text-lg font-semibold text-ink hover:border-ink"
            >
              Browse all products
            </Link>
          </div>
        </div>
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-raised">
          <Image
            src={hero.images[0]}
            alt={hero.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
