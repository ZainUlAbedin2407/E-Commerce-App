import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import FilterSidebar from "@/components/FilterSidebar";
import ProductGrid from "@/components/ProductGrid";
import {
  getCatalogBrands,
  getCatalogCategories,
  getCatalogCategory,
  getCatalogProducts,
  getFilterDefinitions,
  DbUnavailableError,
} from "@/lib/catalog";

// Collection pages render from the live database on every request,
// never a frozen build-time snapshot.
export const dynamic = "force-dynamic";

// NOTE: no generateStaticParams here on purpose. In Next.js, a page
// with generateStaticParams is prerendered (SSG) for the listed paths
// even under force-dynamic, that was the frozen-storefront bug (audit
// C1). Every collection renders on demand from the live database.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  let category = null;
  try {
    category = await getCatalogCategory(slug);
  } catch {
    return { title: "Collection, AI Communication" };
  }
  if (!category) return { title: "Collection, AI Communication" };
  const description = `${category.name} at AI Communication, Shahjahan Electronics Market, Saddar, Karachi. Delivery across Pakistan.`;
  const images = category.cover
    ? [{ url: category.cover, alt: `${category.name}, AI Communication` }]
    : [];
  return {
    title: `${category.name}, AI Communication | Saddar, Karachi`,
    description,
    openGraph: {
      title: `${category.name}, AI Communication | Saddar, Karachi`,
      description,
      images,
    },
  };
}

// Server component: filtering happens on the server so the product list and
// the "Coming soon" empty state are in the initial HTML (SEO + no-JS check).
// Products come from MongoDB when configured, otherwise the Phase 1 seed.
// Filter state lives in the URL, so filtered pages are shareable.
export default async function CollectionPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const brand = sp.brand || "";
  const sort = sp.sort || "";
  const search = sp.search || "";
  const priceMin = sp.priceMin || "";
  const priceMax = sp.priceMax || "";
  const inStock = sp.inStock === "1";
  const rating = sp.rating || "";
  const specFilters = {};
  for (const [key, value] of Object.entries(sp)) {
    if (key.startsWith("spec_") && value) specFilters[key.slice(5)] = value;
  }

  // A DB outage shows a "temporarily unavailable" panel, never a 500 and
  // never the "Coming soon" empty state (audit M1/M11).
  let category = null;
  let products = [];
  let total = 0;
  let categories = [];
  let brands = [];
  let definitions = [];
  let dbDown = false;
  try {
    category = await getCatalogCategory(slug);
    if (!category) notFound();
    const [result, cats, brs, defs, allInCategory] = await Promise.all([
      getCatalogProducts({
        category: category.slug,
        collection: category,
        brand,
        search,
        sort,
        priceMin: priceMin ? Number(priceMin) : null,
        priceMax: priceMax ? Number(priceMax) : null,
        specFilters,
        inStock,
        rating: rating ? Number(rating) : null,
        limit: 100,
      }),
      getCatalogCategories(),
      getCatalogBrands(),
      getFilterDefinitions(),
      getCatalogProducts({ category: category.slug, collection: category, limit: 100 }),
    ]);
    products = result.products;
    total = result.total;
    categories = cats;
    brands = brs;
    definitions = defs;
    // Facets are derived from the products in this category, before
    // the brand and spec filters narrow them.
    const all = allInCategory.products;
    const brandCounts = new Map();
    for (const p of all) {
      const key = p.brandSlug || p.brand;
      brandCounts.set(key, (brandCounts.get(key) || 0) + 1);
    }
    const specCounts = {};
    for (const p of all) {
      for (const [k, v] of Object.entries(p.specs || {})) {
        specCounts[k] = specCounts[k] || new Map();
        specCounts[k].set(v, (specCounts[k].get(v) || 0) + 1);
      }
    }
    const prices = all.map((p) => p.pricePKR).filter((n) => n != null);
    var facets = {
      brands: [...brandCounts.entries()].map(([key, count]) => {
        const name = all.find((p) => (p.brandSlug || p.brand) === key)?.brand || key;
        return { slug: key, name, count };
      }),
      specs: Object.fromEntries(
        Object.entries(specCounts).map(([k, m]) => [
          k,
          [...m.entries()].map(([value, count]) => ({ value, count })),
        ])
      ),
      price:
        prices.length > 0
          ? { min: Math.min(...prices), max: Math.max(...prices) }
          : {},
    };
    var brandList = brands.map((b) => ({ slug: b, name: b }));
  } catch (err) {
    if (err instanceof DbUnavailableError || err?.code === "db_unavailable") {
      dbDown = true;
    } else {
      throw err;
    }
  }

  if (dbDown) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <h2 className="mb-2 font-display text-2xl font-bold text-ink">
          Temporarily unavailable
        </h2>
        <p className="text-muted">
          The shop is temporarily unavailable, please try again shortly.
        </p>
      </div>
    );
  }

  const isSearchNoMatch = search && products.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-12 lg:flex lg:gap-8">
      <Suspense fallback={null}>
        <FilterSidebar
          categories={categories}
          brands={brandList}
          definitions={definitions}
          facets={facets}
        />
      </Suspense>
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-3xl font-bold text-ink">{category.name}</h1>
        <p className="mt-2 text-muted">{category.blurb}</p>
        <p className="mt-2 text-sm text-muted">
          {search
            ? `Search results for "${search}", ${total} found.`
            : `${total} product${total === 1 ? "" : "s"}.`}
        </p>
        {isSearchNoMatch ? (
          <div className="mt-6 rounded-2xl border border-line bg-surface p-10 text-center">
            <p className="mb-2 font-display text-lg font-semibold text-ink">
              No results for &ldquo;{search}&rdquo;
            </p>
            <p className="mb-6 text-muted">
              Try a different word, or browse everything we have in stock.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={`/collections/${category.slug}`}
                className="press inline-flex min-h-12 items-center justify-center rounded-full bg-battery px-6 py-3 font-semibold text-canvas hover:bg-battery-deep"
              >
                Clear search
              </Link>
              <Link
                href="/collections/all"
                className="press inline-flex min-h-12 items-center justify-center rounded-full border border-line bg-surface px-6 py-3 font-semibold text-ink hover:border-battery"
              >
                View all products
              </Link>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-line bg-surface p-10 text-center">
            <p className="mb-2 font-display text-lg font-semibold text-ink">Coming soon</p>
            <p className="mb-4 text-muted">
              There are no {category.name} products listed yet. New stock lands
              regularly, check back soon.
            </p>
            <Link
              href="/collections/all"
              className="press inline-flex min-h-12 items-center justify-center rounded-full bg-battery px-6 py-3 font-semibold text-canvas hover:bg-battery-deep"
            >
              View all products
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <ProductGrid products={products} />
          </div>
        )}
      </div>
    </div>
  );
}
