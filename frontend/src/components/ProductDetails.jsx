"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";
import { getCategory, getProductsByCategory } from "@/lib/products";
import { whatsappOrderLink } from "@/lib/site";
import PriceTag from "./PriceTag";
import ProductGrid from "./ProductGrid";

export default function ProductDetails({ product, related }) {
  const [mainImage, setMainImage] = useState(product.images[0]);
  const [quantity, setQuantity] = useState(1);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const { addToCart } = useCart();
  const category = getCategory(product.category);
  // `related` comes from the catalogue (DB or seed) via the product page.
  // Fall back to the seed only when the page did not pass it.
  const similar =
    related ||
    getProductsByCategory(product.category)
      .filter((p) => p.slug !== product.slug)
      .slice(0, 4);

  const handleAddToCart = () => {
    setIsButtonDisabled(true);
    // Pass a product snapshot so the cart keeps working for products that
    // were added in the admin panel and are not in the Phase 1 seed.
    addToCart(product.slug, quantity, {
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      model: product.model,
      images: product.images,
      pricePKR: product.pricePKR ?? null,
    });
    toast.success(`${product.name} added to cart!`, { duration: 1500 });
    setTimeout(() => setIsButtonDisabled(false), 800);
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <p className="mb-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-orange">Home</Link>
        {" / "}
        <Link href={`/collections/${product.category}`} className="hover:text-brand-orange">
          {category?.name}
        </Link>
        {" / "}
        {product.name}
      </p>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto scrollbar-hide">
              {product.images.map((src) => (
                <button
                  key={src}
                  onClick={() => setMainImage(src)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                    mainImage === src ? "border-brand-orange" : "border-gray-200"
                  }`}
                >
                  <Image src={src} alt={product.name} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            {product.brand} · {product.model}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-brand-black">
            {product.name}
          </h1>
          <p className="mt-3 text-gray-600">{product.shortDesc}</p>

          <div className="mt-4">
            <PriceTag product={product} size="lg" />
            <p className="mt-1 text-sm text-gray-500">
              Price confirmed on WhatsApp — tap &quot;WhatsApp for price&quot; to ask.
            </p>
          </div>

          <div className="mt-6">
            <h3 className="mb-2 font-display font-semibold">Specifications</h3>
            <dl className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between px-4 py-2 text-sm">
                  <dt className="text-gray-500">{key}</dt>
                  <dd className="font-medium text-brand-black">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-gray-200 bg-white">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="cursor-pointer px-3 py-2 text-xl font-medium"
              >
                -
              </button>
              <span className="w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="cursor-pointer px-3 py-2 text-xl font-medium"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isButtonDisabled}
              className="flex-1 cursor-pointer rounded-lg bg-brand-black py-3 font-semibold text-white transition hover:bg-brand-charcoal disabled:opacity-60"
            >
              Add to Cart
            </button>
          </div>

          <a
            href={whatsappOrderLink(product.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block rounded-lg bg-brand-orange py-3 text-center font-semibold text-white transition hover:bg-brand-orange-dark"
          >
            Order on WhatsApp — 0335-5186552
          </a>
          <p className="mt-3 text-sm text-gray-500">
            Cash on Delivery available. Delivery across Pakistan.
          </p>
        </div>
      </div>

      {similar.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold text-brand-black">
            Similar Products
          </h2>
          <ProductGrid products={similar} />
        </div>
      )}
    </div>
  );
}
