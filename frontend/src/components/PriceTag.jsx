import Link from "next/link";
import { whatsappOrderLink } from "@/lib/site";
import { formatPrice } from "@/lib/products";

// Price rule: pricePKR is null until Zain supplies his price list.
// Show "WhatsApp for price" — never invent a price.
export default function PriceTag({ product, size = "md" }) {
  const price = formatPrice(product.pricePKR);
  if (price) {
    return (
      <p
        className={`font-display font-bold text-brand-black ${
          size === "lg" ? "text-2xl" : "text-base"
        }`}
      >
        {price}
      </p>
    );
  }
  return (
    <Link
      href={whatsappOrderLink(product.name)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 font-semibold text-brand-orange hover:text-brand-orange-dark ${
        size === "lg" ? "text-lg" : "text-sm"
      }`}
    >
      WhatsApp for price
    </Link>
  );
}
