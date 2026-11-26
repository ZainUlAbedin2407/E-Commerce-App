import Hero from "@/components/Hero";
import CategoryTiles from "@/components/CategoryTiles";
import NewArrivals from "@/components/NewArrivals";
import FeaturedCollection from "@/components/FeaturedCollection";
import FeaturesSection from "@/components/FeaturesSection";
import ProductGrid from "@/components/ProductGrid";
import {
  getCatalogProduct,
  getCatalogProducts,
  getCategoryTiles,
} from "@/lib/catalog";

// Server component: the catalogue is read here (MongoDB when configured,
// Phase 1 seed otherwise) and passed down as props, so the page is fully
// rendered HTML — no client fetch, no empty flash.
export default async function Home() {
  const [{ products: bestSellers }, { products: newArrivals }, featured, tiles] =
    await Promise.all([
      getCatalogProducts({ sort: "featured", limit: 8 }),
      getCatalogProducts({ sort: "newest", limit: 8 }),
      getCatalogProduct("dv-1089"),
      getCategoryTiles(),
    ]);

  return (
    <div>
      <Hero />
      <CategoryTiles tiles={tiles} />
      <NewArrivals products={newArrivals} />

      <div className="container mx-auto px-4">
        <h2 className="mb-3 text-center font-display text-3xl font-bold uppercase tracking-wide text-brand-black">
          Best Sellers
        </h2>
        <p className="mb-8 text-center text-gray-600">
          Our most-loved original products — ask the price on WhatsApp.
        </p>
        <ProductGrid products={bestSellers} />
      </div>

      <FeaturedCollection product={featured} />
      <FeaturesSection />
    </div>
  );
}
