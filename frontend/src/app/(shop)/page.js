import Link from "next/link";
import Hero from "@/components/Hero";
import CategoryTiles from "@/components/CategoryTiles";
import NewArrivals from "@/components/NewArrivals";
import FeaturedCollection from "@/components/FeaturedCollection";
import FeaturesSection from "@/components/FeaturesSection";
import ProductGrid from "@/components/ProductGrid";
import { Stars } from "@/components/ProductCard";
import {
  getApprovedReviews,
  getBrandsWithCounts,
  getCatalogProduct,
  getCategoryTiles,
  getHomepageSections,
  DbUnavailableError,
} from "@/lib/catalog";
import { formatPrice } from "@/lib/products";

// The homepage MUST render from the live database on every request.
// Sections come from /api/homepage-sections (read here directly, the
// same data, no self-HTTP round trip), in admin order. Any section
// whose products list is empty is hidden: Best Sellers resolves to 0
// products when there are no orders yet, and must not render an empty row.
export const dynamic = "force-dynamic";

function SpeakerComparison({ products }) {
  if (!products || products.length < 2) return null;
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const rows = [
    { label: "Price", get: (p) => (p.pricePKR != null ? formatPrice(p.pricePKR) : "Price coming soon") },
    { label: "Weight", get: (p) => (p.weightKg != null ? `${p.weightKg} kg` : "Not listed") },
    { label: "Lights", get: (p) => p.specs?.Lights || p.specs?.LED || "No LED lights listed" },
    { label: "Inputs", get: (p) => p.specs?.Inputs || "Not listed" },
    { label: "Carry strap", get: (p) => p.specs?.Strap || "Not listed" },
  ];
  const picks = ["dv-1089", "sy-777", "great-nice-gts-2190"]
    .map((s) => bySlug.get(s))
    .filter(Boolean);
  if (picks.length < 2) return null;
  return (
    <section className="px-5 py-12 md:px-12">
      <h2 className="font-display text-3xl font-bold text-ink">Which speaker fits you</h2>
      <p className="mt-3 max-w-[66ch] text-muted">
        The speakers, compared on the same points. Prices and specs are the
        ones on each product page.
      </p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="px-4 py-3 font-semibold text-muted">Speaker</th>
              {picks.map((p) => (
                <th key={p.slug} className="px-4 py-3">
                  <Link href={`/product/${p.slug}`} className="font-semibold text-ink hover:text-battery">
                    {p.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-line last:border-b-0">
                <td className="px-4 py-3 font-semibold text-muted">{row.label}</td>
                {picks.map((p) => (
                  <td key={p.slug} className="px-4 py-3 text-ink">{row.get(p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {picks.map((p) => (
          <div key={p.slug} className="rounded-2xl border border-line bg-surface p-5">
            <p className="font-semibold text-ink">{p.name}</p>
            <p className="mt-1 text-sm text-muted">{p.shortDesc}</p>
            <Link href={`/product/${p.slug}`} className="mt-3 inline-block font-semibold text-battery">
              View speaker
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function Home() {
  const settled = await Promise.allSettled([
    getHomepageSections(),
    getCategoryTiles(),
    getApprovedReviews({}),
    getBrandsWithCounts(),
    getCatalogProduct("dv-1089"),
    getCatalogProduct("sy-777"),
    getCatalogProduct("great-nice-gts-2190"),
  ]);
  const dbDown = settled.some(
    (r) =>
      r.status === "rejected" &&
      (r.reason instanceof DbUnavailableError || r.reason?.code === "db_unavailable")
  );
  if (!dbDown) {
    for (const r of settled) {
      if (r.status === "rejected") throw r.reason;
    }
  }
  const sections = settled[0].status === "fulfilled" ? settled[0].value : [];
  const tiles = settled[1].status === "fulfilled" ? settled[1].value : [];
  const reviews = settled[2].status === "fulfilled" ? settled[2].value.reviews : [];
  const brands = settled[3].status === "fulfilled" ? settled[3].value : [];
  const speakers = [settled[4], settled[5], settled[6]]
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);

  const reviewProductNames = {};
  for (const r of reviews.slice(0, 3)) {
    if (!reviewProductNames[r.productSlug]) {
      const p = await getCatalogProduct(r.productSlug).catch(() => null);
      reviewProductNames[r.productSlug] = p?.name || r.productSlug;
    }
  }

  let comparisonDone = false;
  const renderSection = (section) => {
    const products = section.products || [];
    switch (section.type) {
      case "hero":
        return products.length > 0 ? <Hero key={section._id} product={products[0]} /> : null;
      case "categoryTiles":
        return <CategoryTiles key={section._id} tiles={tiles} />;
      case "productRow": {
        if (products.length === 0) return null;
        const title = section.title || "";
        if (title.toLowerCase().includes("best seller")) {
          return <NewArrivals key={section._id} products={products} title={title} />;
        }
        if (title.toLowerCase().includes("new arrival")) {
          return <NewArrivals key={section._id} products={products} title={title} />;
        }
        return <FeaturedCollection key={section._id} product={products[0]} title={title} />;
      }
      case "brandsStrip":
        if (brands.length === 0) return null;
        return (
          <section key={section._id} className="border-t border-line px-5 py-12 md:px-12">
            <h2 className="font-display text-3xl font-bold text-ink">Brands we stock</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {brands.map((b) => (
                <Link
                  key={b.slug}
                  href={`/brands/${b.slug}`}
                  className="press inline-flex min-h-12 items-center rounded-full border border-line bg-surface px-5 font-semibold text-ink hover:border-battery hover:text-battery"
                >
                  {b.name} ({b.productCount})
                </Link>
              ))}
            </div>
          </section>
        );
      case "reviewsTeaser": {
        if (reviews.length === 0) return null;
        return (
          <section key={section._id} className="reveal px-5 py-12 md:px-12">
            <h2 className="font-display text-3xl font-bold text-ink">What customers said</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="rounded-2xl border border-line bg-surface p-5">
                  <Stars average={r.rating} count={1} />
                  <blockquote className="mt-3 text-ink">&ldquo;{r.body}&rdquo;</blockquote>
                  <figcaption className="mt-3 text-sm text-muted">
                    {r.name || "Customer"}, {reviewProductNames[r.productSlug] || r.productSlug}
                    {r.verified ? " (Verified buyer" : ""}
                    {r.source === "whatsapp" ? ", via WhatsApp)" : r.verified ? ")" : ""}
                  </figcaption>
                </figure>
              ))}
            </div>
            <Link href="/reviews" className="mt-6 inline-block font-semibold text-battery">
              Read all reviews
            </Link>
          </section>
        );
      }
      case "trustBadges":
        return <FeaturesSection key={section._id} />;
      default:
        return null;
    }
  };

  const rendered = [];
  for (const section of sections) {
    if (section.type === "reviewsTeaser" && !comparisonDone) {
      rendered.push(<SpeakerComparison key="speaker-compare" products={speakers} />);
      comparisonDone = true;
    }
    rendered.push(renderSection(section));
  }
  if (!comparisonDone) {
    rendered.push(<SpeakerComparison key="speaker-compare" products={speakers} />);
  }

  return (
    <div>
      {dbDown && (
        <div className="bg-surface px-4 py-3 text-center text-sm font-semibold text-ink">
          The shop is temporarily unavailable, please try again shortly.
        </div>
      )}
      {rendered}
      {sections.length === 0 && (
        <div className="mx-auto max-w-7xl px-5 py-12 md:px-12">
          <h2 className="font-display text-3xl font-bold text-ink">All products</h2>
          <div className="mt-6">
            <ProductGrid products={[]} emptyMessage="No products yet." />
          </div>
        </div>
      )}
    </div>
  );
}
