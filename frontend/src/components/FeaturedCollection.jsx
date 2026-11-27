import Image from "next/image";
import Link from "next/link";
import { getProduct } from "@/lib/products";
import PriceTag from "./PriceTag";

// Featured product story, problem first, then the spec that serves it.
// `product` comes from the catalogue (DB or seed) via the home page.
// The copy is the product's own shortDesc plus its real specs, so it
// can never desync from the product it shows.
export default function FeaturedCollection({ product, title }) {
  const featured = product || getProduct("omxmo-ox-pd10");
  if (!featured) return null;
  const specs = Object.entries(featured.specs || {}).slice(0, 4);
  return (
    <section className="px-5 py-12 md:px-12">
      <div className="grid grid-cols-1 items-center gap-8 overflow-hidden rounded-2xl bg-surface p-6 md:p-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
            {title || "Power that lasts the day"}
          </h2>
          <p className="mt-4 max-w-[66ch] text-lg text-muted">
            Load shedding in the middle of a call, a phone at 4 percent on the
            way home. {featured.shortDesc}
          </p>
          {specs.length > 0 && (
            <dl className="mt-6 divide-y divide-line border-y border-line">
              {specs.map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 py-2 text-sm">
                  <dt className="text-muted">{key}</dt>
                  <dd className="text-right font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-6">
            <PriceTag product={featured} size="lg" />
          </div>
          <Link
            href={`/product/${featured.slug}`}
            className="press mt-4 inline-flex min-h-12 items-center rounded-full bg-battery px-8 py-3 text-lg font-semibold text-canvas hover:bg-battery-deep"
          >
            View {featured.model || featured.name}
          </Link>
        </div>
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-raised">
          <Image
            src={featured.images[1] || featured.images[0]}
            alt={featured.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
