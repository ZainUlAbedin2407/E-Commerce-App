import Image from "next/image";
import Link from "next/link";
import PriceTag from "./PriceTag";

// Star row: filled stars for the rounded average, plus the review count.
// Average and count come from the API aggregate (approved reviews only).
export function Stars({ average = 0, count = 0, size = "text-sm" }) {
  if (!count) {
    return <span className={`text-muted ${size}`}>No reviews yet</span>;
  }
  const filled = Math.round(average);
  return (
    <span
      className={`inline-flex items-center gap-1 ${size}`}
      aria-label={`${average} out of 5 stars, ${count} reviews`}
    >
      <span className="text-battery" aria-hidden="true">
        {"★".repeat(filled)}
        {"☆".repeat(Math.max(0, 5 - filled))}
      </span>
      <span className="text-muted">
        {average} ({count})
      </span>
    </span>
  );
}

// Product card: aspect-square image box, object-cover, the box reserves
// its space with aspect-ratio so the grid never shifts while loading.
// Hover: 1.05x zoom plus swap to the second image. Mobile: a small
// swipe indicator on the image corner when there is a second image.
// Two products per row on mobile.
export default function ProductCard({ product }) {
  const images = product.images || [];
  const image = images[0];
  const second = images[1];
  const outOfStock = product.stock != null && product.stock <= 0;
  const lowStock =
    product.stock != null &&
    product.stock > 0 &&
    product.stock <= (product.lowStockThreshold ?? 5);
  return (
    <Link
      href={`/product/${product.slug}`}
      className="card-zoom group block min-w-0 rounded-2xl border border-line bg-surface p-3 transition-colors hover:border-battery"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-raised">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-3xl font-bold text-battery">
            {product.name.slice(0, 1)}
          </span>
        )}
        {second && (
          <Image
            src={second}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            aria-hidden="true"
          />
        )}
        {product.isNew && (
          <span className="absolute left-2 top-2 rounded-full bg-battery px-2 py-1 text-xs font-bold text-canvas">
            New
          </span>
        )}
        {outOfStock && (
          <span className="absolute right-2 top-2 rounded-full bg-canvas px-2 py-1 text-xs font-bold text-ink">
            Out of stock
          </span>
        )}
        {second && (
          <span
            aria-hidden="true"
            className="absolute bottom-2 right-2 rounded-full bg-canvas/80 px-2 py-0.5 text-[11px] font-bold text-ink md:hidden"
          >
            Swipe
          </span>
        )}
      </div>
      <p className="mt-3 truncate text-xs font-semibold uppercase tracking-wider text-muted">
        {product.brand}
        {product.model ? `, ${product.model}` : ""}
      </p>
      <h3 className="mt-1 line-clamp-2 min-h-10 font-display text-sm font-semibold text-ink sm:text-base">
        {product.name}
      </h3>
      <div className="mt-2">
        <PriceTag product={product} />
      </div>
      <div className="mt-1">
        <Stars average={product.averageRating || 0} count={product.reviewCount || 0} />
      </div>
      <p className="mt-1 text-xs text-muted">
        {outOfStock
          ? "Out of stock"
          : lowStock
            ? `Only ${product.stock} left`
            : product.stock != null
              ? "In stock"
              : "In stock at Saddar shop"}
      </p>
    </Link>
  );
}
