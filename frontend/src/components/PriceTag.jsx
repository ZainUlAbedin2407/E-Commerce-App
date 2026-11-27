import { formatPrice } from "@/lib/products";

// Price rule: every product on the site must carry a real price. A
// null price means the product is not ready to sell yet, so it shows
// plain text and no order link. Never invent a price, and never link
// out to WhatsApp for a price. When a compare-at price is set and is
// greater than the price, show it struck through.
// Price is always battery orange on the dark canvas.
export default function PriceTag({ product, size = "md" }) {
  const price = formatPrice(product.pricePKR);
  if (price) {
    return (
      <div className="flex flex-wrap items-baseline gap-2">
        <p
          className={`font-display font-bold text-battery ${
            size === "lg" ? "text-2xl" : "text-base"
          }`}
        >
          {price}
        </p>
        {product.compareAtPricePKR > product.pricePKR && (
          <span className="text-sm text-muted line-through">
            {formatPrice(product.compareAtPricePKR)}
          </span>
        )}
      </div>
    );
  }
  return (
    <p className={`font-semibold text-muted ${size === "lg" ? "text-lg" : "text-sm"}`}>
      Price coming soon
    </p>
  );
}
