"use client";

import Image from "next/image";
import Link from "next/link";
import { RiDeleteBin3Line } from "react-icons/ri";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";
import { DELIVERY_KARACHI_PKR, DELIVERY_OTHER_PKR } from "@/lib/site";
import PriceTag from "./PriceTag";

export default function CartContents() {
  const { items, setQty, removeFromCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted">Your cart is empty.</p>
        <Link href="/collections/all" className="mt-4 inline-block font-semibold text-battery hover:text-battery-deep">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div>
      {items.map(({ product, qty }) => (
        <div
          key={product.slug}
          className="flex items-start justify-between gap-2 border-b border-line py-4"
        >
          <div className="flex min-w-0 items-start">
            {product.images?.[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                width={80}
                height={80}
                className="mr-4 h-20 w-20 shrink-0 rounded-xl bg-raised object-cover"
              />
            ) : (
              <span className="mr-4 flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-raised font-display font-bold text-battery">
                {product.name.slice(0, 1)}
              </span>
            )}
            <div className="min-w-0">
              <h3 className="font-display text-sm font-semibold text-ink">{product.name}</h3>
              <p className="text-sm text-muted">
                {product.brand}
                {product.model ? `, ${product.model}` : ""}
              </p>
              <div className="mt-1">
                <PriceTag product={product} />
              </div>
              <div className="mt-2 flex items-center">
                <button
                  onClick={() => setQty(product.slug, qty - 1)}
                  aria-label="Decrease quantity"
                  className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-lg border border-line text-xl font-medium text-ink"
                >
                  -
                </button>
                <span className="mx-4 text-ink">{qty}</span>
                <button
                  onClick={() => setQty(product.slug, qty + 1)}
                  aria-label="Increase quantity"
                  className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-lg border border-line text-xl font-medium text-ink"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => removeFromCart(product.slug)}
            aria-label={`Remove ${product.name}`}
            className="flex min-h-12 min-w-12 items-start justify-center"
          >
            <RiDeleteBin3Line className="mt-2 h-6 w-6 text-danger" />
          </button>
        </div>
      ))}
      <p className="mt-4 text-sm text-muted">
        Delivery: Karachi {formatPrice(DELIVERY_KARACHI_PKR)}, rest of Pakistan{" "}
        {formatPrice(DELIVERY_OTHER_PKR)} (up to 1 kg). Items without a price cannot be
        ordered yet.
      </p>
    </div>
  );
}
