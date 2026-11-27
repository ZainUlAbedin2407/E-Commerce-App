import ProductCard from "./ProductCard";

// Grid: 2 cols mobile, 3 tablet, 4 desktop.
export default function ProductGrid({ products, emptyMessage }) {
  if (!products || products.length === 0) {
    return (
      <p className="py-10 text-center text-muted">
        {emptyMessage || "No products in this category yet."}
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id || product.slug} product={product} />
      ))}
    </div>
  );
}
