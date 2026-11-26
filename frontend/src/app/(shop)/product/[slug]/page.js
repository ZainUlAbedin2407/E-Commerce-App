import { notFound } from "next/navigation";
import ProductDetails from "@/components/ProductDetails";
import { getCatalogProduct, getRelatedProducts } from "@/lib/catalog";
import { PRODUCTS } from "@/lib/products";

// Static params come from the seed so the 4 hero pages are prerendered at
// build time (no DB during build). Products added later in the admin panel
// render on demand — dynamicParams is left open.
export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  if (!product) return { title: "Product — AI Communication" };
  return {
    title: `${product.name} — AI Communication`,
    description: `${product.shortDesc} Original product at AI Communication, Saddar, Karachi. Cash on Delivery across Pakistan. WhatsApp 0335-5186552.`,
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product);
  return <ProductDetails product={product} related={related} />;
}
