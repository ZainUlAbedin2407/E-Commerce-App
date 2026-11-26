import Image from "next/image";
import Link from "next/link";
import { CATEGORIES, getProductsByCategory } from "@/lib/products";

// `tiles` comes from the catalogue (DB or seed) via the home page:
// [{ slug, name, blurb, count, cover }]. Without it, the seed is used.
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
    <section className="container mx-auto px-4 py-12">
      <h2 className="mb-8 text-center font-display text-3xl font-bold uppercase tracking-wide text-brand-black">
        Shop by Category
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {list.map((category) => (
          <Link
            key={category.slug}
            href={`/collections/${category.slug}`}
            className="group relative block overflow-hidden rounded-lg bg-brand-charcoal"
          >
            <div className="relative aspect-[4/3] w-full">
              {category.cover ? (
                <Image
                  src={category.cover}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover opacity-90 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-brand-paper">
                  <span className="px-4 text-center font-display text-lg font-bold text-brand-black">
                    {category.name}
                  </span>
                </div>
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-black/85 to-transparent p-4 pt-10">
              <h3 className="font-display text-lg font-bold uppercase text-white">
                {category.name}
              </h3>
              <p className="text-sm text-brand-cream">
                {category.count > 0
                  ? `${category.count} product${category.count > 1 ? "s" : ""} · ${category.blurb}`
                  : `Coming soon — new products are added from the admin panel`}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
