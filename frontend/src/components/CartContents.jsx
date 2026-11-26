"use client";

import Image from "next/image";
import Link from "next/link";
import { RiDeleteBin3Line } from "react-icons/ri";
import { useCart } from "@/lib/cart-context";
import PriceTag from "./PriceTag";

export default function CartContents() {
  const { items, setQty, removeFromCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">Your cart is empty.</p>
        <Link href="/collections/all" className="mt-4 inline-block font-semibold text-brand-orange hover:text-brand-orange-dark">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div>
      {items.map(({ product, qty }) => (
        <div
          key={product.id}
          className="flex items-start justify-between border-b border-gray-200 py-4"
        >
          <div className="flex items-start">
            <Image
              src={product.images[0]}
              alt={product.name}
              width={80}
              height={96}
              className="mr-4 h-24 w-20 rounded object-cover"
            />
            <div>
              <h3 className="font-display text-sm font-semibold">{product.name}</h3>
              <p className="text-sm text-gray-500">
                {product.brand} · {product.model}
              </p>
              <div className="mt-1">
                <PriceTag product={product} />
              </div>
              <div className="mt-2 flex items-center">
                <button
                  onClick={() => setQty(product.slug, qty - 1)}
                  aria-label="Decrease quantity"
                  className="cursor-pointer rounded border border-gray-200 px-2 py-1 text-xl font-medium"
                >
                  -
                </button>
                <span className="mx-4">{qty}</span>
                <button
                  onClick={() => setQty(product.slug, qty + 1)}
                  aria-label="Increase quantity"
                  className="cursor-pointer rounded border border-gray-200 px-2 py-1 text-xl font-medium"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <button onClick={() => removeFromCart(product.slug)} aria-label={`Remove ${product.name}`}>
            <RiDeleteBin3Line className="mt-2 h-6 w-6 text-red-600" />
          </button>
        </div>
      ))}
      <p className="mt-4 text-sm text-gray-500">
        Prices are confirmed on WhatsApp before delivery. Delivery charges are
        confirmed on WhatsApp too.
      </p>
    </div>
  );
}
