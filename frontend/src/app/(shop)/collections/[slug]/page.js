import { Suspense } from "react";
import { notFound } from "next/navigation";
import FilterSidebar from "@/components/FilterSidebar";
import ProductGrid from "@/components/ProductGrid";
import {
  getCatalogBrands,
  getCatalogCategories,
  getCatalogCategory,
  getCatalogProducts,
} from "@/lib/catalog";
import { whatsappLink } from "@/lib/site";

export function generateStaticParams() {
  return [
    { slug: "all" },
    { slug: "earbuds" },
    { slug: "smartwatches" },
    { slug: "power-banks" },
    { slug: "speakers" },
    { slug: "chargers" },
    { slug: "handsfree" },
  ];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCatalogCategory(slug);
  if (!category) return { title: "Collection — AI Communication" };
  return {
    title: `${category.name} — AI Communication | Saddar, Karachi`,
    description: `${category.name} at AI Communication, Shahjahan Electronics Market, Saddar, Karachi. Cash on Delivery across Pakistan. WhatsApp 0335-5186552.`,
  };
}

// Server component: filtering happens on the server so the product list and
// the "Coming soon" empty state are in the initial HTML (SEO + no-JS check).
// Products come from MongoDB when configured, otherwise the Phase 1 seed.
export default async function CollectionPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCatalogCategory(slug);
  if (!category) notFound();

  const brand = sp.brand || "";
  const sort = sp.sort || "";
  const search = sp.search || "";

  const [{ products }, categories, brands] = await Promise.all([
    getCatalogProducts({ category: category.slug, brand, search, sort }),
    getCatalogCategories(),
    getCatalogBrands(),
  ]);

  return (
    <div className="flex flex-col lg:flex-row">
      <Suspense fallback={null}>
        <FilterSidebar categories={categories} brands={brands} />
      </Suspense>
      <div className="flex-grow p-4">
        <h2 className="mb-2 font-display text-2xl font-bold uppercase text-brand-black">
          {category.name}
        </h2>
        <p className="mb-4 text-gray-600">{category.blurb}</p>
        {search && (
          <p className="mb-4 text-sm text-gray-600">
            Search results for &ldquo;{search}&rdquo; — {products.length} found.
          </p>
        )}
        {products.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-10 text-center">
            <p className="mb-2 font-display text-lg font-semibold">
              Coming soon — new products are added from the admin panel.
            </p>
            <p className="mb-4 text-gray-600">
              There are no {category.name} products listed yet. More products
              are added from the admin panel — ask us on WhatsApp and we will
              tell you when they land.
            </p>
            <a
              href={whatsappLink(
                `Assalam-o-Alaikum! ${category.name} kab stock mein aayenge?`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-brand-orange px-6 py-3 font-semibold text-white hover:bg-brand-orange-dark"
            >
              Ask on WhatsApp
            </a>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  );
}
