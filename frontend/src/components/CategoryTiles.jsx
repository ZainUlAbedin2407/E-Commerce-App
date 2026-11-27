import Image from "next/image";
import Link from "next/link";
import { CATEGORIES, getProductsByCategory } from "@/lib/products";

// `tiles` comes from the catalogue (DB or seed) via the home page:
// [{ slug, name, blurb, count, cover }]. Without it, the seed is used.
// Edge-to-edge, alternating charcoal tones, zero gap. The color change
// is the break, not a border or a margin. No light tiles. An empty
// category renders as a "Coming soon" tile, never a fake photo.
export default function CategoryTiles({ tiles }) {
  const list =
    tiles ||
    CATEGORIES.map((category) => {
      const products = getProductsByCategory(category.slug);
      return {
        ...category,
        count: products.length,
        cover: products[0]?.images[0] || "",
      };
    });

  return (
    <section aria-label="Shop by category" className="w-full">
      <h2 className="px-5 pt-10 pb-6 font-display text-3xl font-bold text-ink md:px-12">
        Shop by category
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {list.map((category, i) => (
          <Link
            key={category.slug}
            href={`/collections/${category.slug}`}
            className={`group relative block overflow-hidden ${
              i % 2 === 0 ? "bg-surface" : "bg-raised"
            }`}
          >
            {category.cover ? (
              <>
                <div className="relative aspect-square w-full">
                  <Image
                    src={category.cover}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover opacity-90 transition duration-200 group-hover:scale-105 group-hover:opacity-100"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-canvas/70 p-4">
                  <h3 className="font-display text-base font-bold text-ink">
                    {category.name}
                  </h3>
                  <p className="text-xs text-muted">
                    {category.count} product{category.count === 1 ? "" : "s"}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 p-4 text-center">
                <h3 className="font-display text-base font-bold text-ink">
                  {category.name}
                </h3>
                <span className="rounded-full bg-battery px-2 py-0.5 text-xs font-bold text-canvas">
                  Coming soon
                </span>
                <p className="line-clamp-2 text-xs text-muted">{category.blurb}</p>
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
