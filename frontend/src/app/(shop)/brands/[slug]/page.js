import Image from "next/image";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
import { getBrandsWithCounts, getCatalogProducts, DbUnavailableError } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  let brand = null;
  try {
    brand = (await getBrandsWithCounts()).find((b) => b.slug === slug);
  } catch {
    return { title: "Brand, AI Communication" };
  }
  if (!brand) return { title: "Brand, AI Communication" };
  return {
    title: `${brand.name}, AI Communication`,
    description: `${brand.name} products at AI Communication, Saddar, Karachi.`,
  };
}

export default async function BrandPage({ params }) {
  const { slug } = await params;
  let brand = null;
  let products = [];
  let dbDown = false;
  try {
    brand = (await getBrandsWithCounts()).find((b) => b.slug === slug);
    if (!brand) notFound();
    ({ products } = await getCatalogProducts({ brand: slug, limit: 100 }));
  } catch (err) {
    if (err instanceof DbUnavailableError || err?.code === "db_unavailable") dbDown = true;
    else throw err;
  }
  if (dbDown) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <h2 className="mb-2 font-display text-2xl font-bold text-ink">Temporarily unavailable</h2>
        <p className="text-muted">The shop is temporarily unavailable, please try again shortly.</p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-12">
      <div className="flex flex-col items-start gap-6 sm:flex-row">
        {brand.logo && (
          <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-2xl bg-raised">
            <Image src={brand.logo} alt={brand.name} fill className="object-cover" />
          </div>
        )}
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">{brand.name}</h1>
          {brand.description && <p className="mt-2 max-w-[66ch] text-muted">{brand.description}</p>}
          <p className="mt-2 text-sm text-muted">
            {products.length} product{products.length === 1 ? "" : "s"} at AI Communication
          </p>
        </div>
      </div>
      <div className="mt-8">
        {products.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-10 text-center text-muted">
            Coming soon. No {brand.name} products are listed yet.
          </p>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  );
}
