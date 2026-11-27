import { notFound } from "next/navigation";
import ProductDetails from "@/components/ProductDetails";
import { getCatalogProduct, getRelatedProducts, DbUnavailableError } from "@/lib/catalog";

// Product pages render from the live database on every request
// (force-dynamic). There is deliberately NO generateStaticParams here: in
// Next.js a page with generateStaticParams is prerendered (SSG) for the
// listed paths even under force-dynamic, that was the frozen-storefront
// bug. An admin price edit now shows within seconds, no redeploy.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  let product = null;
  try {
    product = await getCatalogProduct(slug);
  } catch {
    return { title: "Product, AI Communication" };
  }
  if (!product) return { title: "Product, AI Communication" };
  const description = `${product.shortDesc} Original product at AI Communication, Saddar, Karachi. Delivery across Pakistan.`;
  const images = product.images?.[0]
    ? [{ url: product.images[0], alt: product.name }]
    : [];
  return {
    title: `${product.name}, AI Communication`,
    description,
    openGraph: { title: `${product.name}, AI Communication`, description, images },
    twitter: { card: "summary_large_image", title: `${product.name}, AI Communication`, description, images: images.map((i) => i.url) },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  let product = null;
  let dbDown = false;
  try {
    product = await getCatalogProduct(slug);
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
          This product is temporarily unavailable, please try again shortly.
        </p>
      </div>
    );
  }
  if (!product) notFound();
  let related = [];
  try {
    related = await getRelatedProducts(product);
  } catch (err) {
    if (!(err instanceof DbUnavailableError || err?.code === "db_unavailable")) {
      throw err;
    }
  }
  return <ProductDetails product={product} related={related} />;
}
