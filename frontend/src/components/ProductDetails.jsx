"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";
import { getCategory, getProductsByCategory, formatPrice } from "@/lib/products";
import {
  DELIVERY_KARACHI_PKR,
  DELIVERY_OTHER_PKR,
  DELIVERY_EXTRA_KG_PKR,
  COD_MAX_TOTAL_PKR,
} from "@/lib/site";
import PriceTag from "./PriceTag";
import ProductGrid from "./ProductGrid";
import { Stars } from "./ProductCard";

// PDP: one grid, one gutter, one fixed left edge. Gallery: desktop
// vertical thumbnail strip left, large image center, sticky purchase
// rail right. Mobile: full-width swipeable carousel with dots, no
// thumbnail strip, pinch-to-zoom via the native image viewer link.
// Price, delivery cost and returns in one line, stock status within
// sight of the add-to-cart button. Reviews come from /api/reviews,
// both sources in one list, newest first.
function ReviewForm({ productSlug }) {
  const [form, setForm] = useState({
    orderNo: "",
    phone: "",
    name: "",
    rating: 5,
    title: "",
    body: "",
  });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (form.body.trim().length < 3) {
      setMsg("Write a few words about the product.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug,
          orderNo: form.orderNo.trim(),
          phone: form.phone.trim(),
          name: form.name.trim(),
          rating: Number(form.rating),
          title: form.title.trim(),
          body: form.body.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || "Could not submit your review. Try again.");
        return;
      }
      if (data.review?.verified) {
        setMsg("Thank you. Your verified review is published.");
      } else {
        setMsg("Thank you. Your review is waiting for approval and will show here once approved.");
      }
      setForm({ orderNo: "", phone: "", name: "", rating: 5, title: "", body: "" });
    } catch {
      setMsg("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };
  const input =
    "w-full rounded-xl border border-line bg-raised p-3 text-base text-ink placeholder:text-muted";
  return (
    <form onSubmit={submit} noValidate className="mt-6 rounded-2xl border border-line bg-surface p-5">
      <h3 className="font-display text-lg font-bold text-ink">Write a review</h3>
      <p className="mt-1 text-sm text-muted">
        Add your order number and the phone you ordered with. Reviews that
        match a delivered order publish at once with a Verified buyer badge.
        Others wait for approval.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rev-order" className="mb-1 block text-sm font-semibold text-ink">Order number</label>
          <input id="rev-order" value={form.orderNo} onChange={set("orderNo")} className={input} placeholder="AIC-0001" />
        </div>
        <div>
          <label htmlFor="rev-phone" className="mb-1 block text-sm font-semibold text-ink">Phone</label>
          <input id="rev-phone" type="tel" value={form.phone} onChange={set("phone")} className={input} placeholder="03XX-XXXXXXX" />
        </div>
        <div>
          <label htmlFor="rev-name" className="mb-1 block text-sm font-semibold text-ink">Your name</label>
          <input id="rev-name" value={form.name} onChange={set("name")} className={input} placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="rev-rating" className="mb-1 block text-sm font-semibold text-ink">Rating</label>
          <select id="rev-rating" value={form.rating} onChange={set("rating")} className={input}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="rev-title" className="mb-1 block text-sm font-semibold text-ink">Title</label>
        <input id="rev-title" value={form.title} onChange={set("title")} className={input} placeholder="Short title" />
      </div>
      <div className="mt-4">
        <label htmlFor="rev-body" className="mb-1 block text-sm font-semibold text-ink">Your review</label>
        <textarea id="rev-body" value={form.body} onChange={set("body")} rows={4} className={input} placeholder="How is the sound, the battery, the build?" />
      </div>
      {msg && <p className="mt-3 text-sm font-medium text-ink">{msg}</p>}
      <button
        type="submit"
        disabled={busy}
        className="press mt-4 inline-flex min-h-12 items-center rounded-full bg-battery px-8 py-3 font-semibold text-canvas hover:bg-battery-deep disabled:opacity-60"
      >
        {busy ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}

export default function ProductDetails({ product, related }) {
  const images = product.images || [];
  const [index, setIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [buyVisible, setBuyVisible] = useState(true);
  const [reviews, setReviews] = useState(null);
  // Seeded from the server-side aggregate on the product, so the JSON-LD
  // AggregateRating is in the initial HTML. The client fetch refreshes it.
  const [agg, setAgg] = useState({
    average: product.averageRating || 0,
    count: product.reviewCount || 0,
    byRating: {},
  });
  const buyRef = useRef(null);
  const mobileRef = useRef(null);
  const { addToCart } = useCart();
  const category = getCategory(product.category);
  const similar =
    related ||
    getProductsByCategory(product.category)
      .filter((p) => p.slug !== product.slug)
      .slice(0, 4);

  const tracked = product.stock != null;
  const outOfStock = tracked && product.stock <= 0;
  const warranty =
    product.warrantyMonths > 0
      ? `${product.warrantyMonths}-month warranty`
      : "Checking warranty";

  useEffect(() => {
    fetch(`/api/reviews?product=${encodeURIComponent(product.slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setReviews(data.reviews || []);
          setAgg(data.aggregate || null);
        }
      })
      .catch(() => {});
  }, [product.slug]);

  useEffect(() => {
    const el = buyRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([entry]) => setBuyVisible(entry.isIntersecting), {
      threshold: 0.1,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleAddToCart = () => {
    addToCart(product.slug, quantity, {
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      model: product.model,
      images: product.images,
      pricePKR: product.pricePKR ?? null,
      weightKg: product.weightKg ?? null,
    });
    toast.success(`${product.name} added to cart`, { duration: 1500 });
  };

  const scrollMobileTo = (i) => {
    setIndex(i);
    const el = mobileRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    description: product.shortDesc,
    image: images,
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.pricePKR ?? undefined,
      availability:
        outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
    aggregateRating:
      agg && agg.count
        ? {
            "@type": "AggregateRating",
            ratingValue: agg.average,
            reviewCount: agg.count,
          }
        : undefined,
  };

  const buyBox = (
    <>
      <div className="mt-4">
        <PriceTag product={product} size="lg" />
        {product.pricePKR == null && (
          <p className="mt-1 text-sm text-muted">Price coming soon.</p>
        )}
      </div>
      <p className="mt-2 text-sm text-muted">
        Delivery Karachi {formatPrice(DELIVERY_KARACHI_PKR)}, rest of Pakistan{" "}
        {formatPrice(DELIVERY_OTHER_PKR)} (up to 1 kg, +{formatPrice(DELIVERY_EXTRA_KG_PKR)} per
        extra kg). COD up to {formatPrice(COD_MAX_TOTAL_PKR)}.{" "}
        <Link href="/returns" className="font-semibold text-battery">
          Returns and warranty
        </Link>
      </p>
      {product.pricePKR != null && !outOfStock && (
        <div className="mt-5 flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-line bg-surface">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center px-3 text-xl font-medium text-ink disabled:opacity-40"
            >
              -
            </button>
            <span className="w-8 text-center text-ink">{quantity}</span>
            <button
              onClick={() =>
                setQuantity((q) => Math.min(tracked ? product.stock : 99, q + 1))
              }
              disabled={tracked && quantity >= product.stock}
              aria-label="Increase quantity"
              className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center px-3 text-xl font-medium text-ink disabled:opacity-40"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            className="press flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-full bg-battery py-3 font-semibold text-canvas hover:bg-battery-deep"
          >
            Add to Cart
          </button>
        </div>
      )}
      {outOfStock && (
        <p className="mt-5 rounded-xl border border-line bg-surface p-4 text-sm font-semibold text-ink">
          Out of stock right now. Check back soon, new stock lands regularly.
        </p>
      )}
      {product.pricePKR == null && (
        <p className="mt-5 rounded-xl border border-line bg-surface p-4 text-sm text-muted">
          Price coming soon. This product cannot be ordered until its price is set.
        </p>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-battery">Home</Link>
        {" / "}
        <Link href={`/collections/${product.category}`} className="hover:text-battery">
          {category?.name}
        </Link>
        {" / "}
        {product.name}
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[80px_1fr_360px] lg:gap-12">
        {images.length > 1 && (
          <div className="hidden flex-col gap-3 lg:flex">
            {images.map((src, i) => (
              <button
                key={src}
                onClick={() => setIndex(i)}
                aria-label={`View photo ${i + 1}`}
                className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-raised ${
                  index === i ? "border-battery" : "border-line"
                }`}
              >
                <Image src={src} alt={product.name} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}

        <div>
          <div
            ref={mobileRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              setIndex(Math.round(el.scrollLeft / el.clientWidth));
            }}
            className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide lg:block lg:overflow-visible"
          >
            {images.map((src, i) => (
              <div
                key={src}
                className="relative aspect-square w-full shrink-0 snap-center overflow-hidden rounded-2xl bg-raised lg:hidden"
              >
                <Image
                  src={src}
                  alt={product.name}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority={i === 0}
                />
              </div>
            ))}
            <div className="relative hidden aspect-square w-full overflow-hidden rounded-2xl bg-raised lg:block">
              <Image
                src={images[index] || images[0]}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex justify-center gap-2 lg:hidden">
              {images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => scrollMobileTo(i)}
                  aria-label={`Go to photo ${i + 1}`}
                  className={`h-2.5 w-2.5 rounded-full ${index === i ? "bg-battery" : "bg-line"}`}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-muted">
            {product.brand}
            {product.model ? `, ${product.model}` : ""}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">{product.name}</h1>
          <div className="mt-2">
            <Stars average={product.averageRating || agg?.average || 0} count={product.reviewCount || agg?.count || 0} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {tracked ? (
              outOfStock ? (
                <span className="rounded-full bg-raised px-3 py-1 text-xs font-bold text-ink">Out of stock</span>
              ) : (
                <span className="rounded-full bg-raised px-3 py-1 text-xs font-bold text-success">
                  In stock{product.stock <= 5 ? `, only ${product.stock} left` : ""}
                </span>
              )
            ) : (
              <span className="rounded-full bg-raised px-3 py-1 text-xs font-bold text-muted">In stock at Saddar shop</span>
            )}
            <span className="rounded-full bg-raised px-3 py-1 text-xs font-bold text-battery">{warranty}</span>
          </div>
          <p className="mt-3 text-muted">{product.shortDesc}</p>
          <div ref={buyRef}>{buyBox}</div>
          <div className="mt-5 rounded-xl border border-line bg-surface p-4 text-sm text-muted">
            <p>
              <span className="font-semibold text-ink">Delivery:</span> Karachi{" "}
              {formatPrice(DELIVERY_KARACHI_PKR)}, rest of Pakistan{" "}
              {formatPrice(DELIVERY_OTHER_PKR)} up to 1 kg, +{formatPrice(DELIVERY_EXTRA_KG_PKR)}{" "}
              per extra kg. Dispatched from Saddar after payment confirmation.
            </p>
            <p className="mt-2">
              <span className="font-semibold text-ink">Warranty:</span> checking warranty on
              every product, each one tested before dispatch.{" "}
              {product.warrantyMonths > 0 && `This item carries a ${product.warrantyMonths}-month warranty. `}
              <Link href="/returns" className="font-semibold text-battery">
                Returns and Warranty
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 max-w-3xl">
        <details className="rounded-2xl border border-line bg-surface" open>
          <summary className="cursor-pointer px-5 py-4 font-display text-lg font-bold text-ink">
            Specifications
          </summary>
          <dl className="divide-y divide-line border-t border-line px-5">
            {Object.entries(product.specs || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 py-3 text-sm">
                <dt className="text-muted">{key}</dt>
                <dd className="text-right font-medium text-ink">{value}</dd>
              </div>
            ))}
            {product.weightKg != null && (
              <div className="flex justify-between gap-4 py-3 text-sm">
                <dt className="text-muted">Weight</dt>
                <dd className="text-right font-medium text-ink">{product.weightKg} kg</dd>
              </div>
            )}
          </dl>
        </details>
        <details className="mt-4 rounded-2xl border border-line bg-surface">
          <summary className="cursor-pointer px-5 py-4 font-display text-lg font-bold text-ink">
            Delivery and returns
          </summary>
          <div className="border-t border-line px-5 py-4 text-sm text-muted">
            <p>
              Delivery Karachi {formatPrice(DELIVERY_KARACHI_PKR)}, rest of Pakistan{" "}
              {formatPrice(DELIVERY_OTHER_PKR)} up to 1 kg, +{formatPrice(DELIVERY_EXTRA_KG_PKR)}{" "}
              per extra kg. COD is available for orders up to {formatPrice(COD_MAX_TOTAL_PKR)};
              above that, orders are paid 100 percent in advance on the website.
            </p>
            <p className="mt-2">
              Check your parcel at once when it arrives. If it does not work or is not what you
              ordered, contact us with your order number and a short video or photo. Full policy:{" "}
              <Link href="/returns" className="font-semibold text-battery">Returns and Warranty</Link>.
            </p>
          </div>
        </details>
      </div>

      <section className="mt-12 max-w-3xl" aria-label="Customer reviews">
        <h2 className="font-display text-2xl font-bold text-ink">Reviews</h2>
        {agg && agg.count > 0 && (
          <p className="mt-2 text-muted">
            <Stars average={agg.average} count={agg.count} /> Average {agg.average} out of 5
            from {agg.count} review{agg.count === 1 ? "" : "s"}.
          </p>
        )}
        {reviews === null && <div className="skeleton mt-4 h-24 rounded-2xl" />}
        {reviews && reviews.length === 0 && (
          <p className="mt-4 text-muted">No reviews yet for this product.</p>
        )}
        {reviews && reviews.length > 0 && (
          <ul className="mt-4 space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{r.name || "Customer"}</span>
                  <span className="text-battery" aria-label={`${r.rating} out of 5 stars`}>
                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                  </span>
                  {r.verified && (
                    <span className="rounded-full bg-raised px-2 py-0.5 text-xs font-bold text-success">
                      Verified buyer
                    </span>
                  )}
                  {r.source === "whatsapp" && (
                    <span className="rounded-full bg-raised px-2 py-0.5 text-xs font-bold text-muted">
                      via WhatsApp
                    </span>
                  )}
                </div>
                {r.title && <p className="mt-2 font-semibold text-ink">{r.title}</p>}
                <p className="mt-1 text-muted">{r.body}</p>
                {r.adminReply && (
                  <p className="mt-3 rounded-xl bg-raised p-3 text-sm text-ink">
                    <span className="font-semibold">AI Communication:</span> {r.adminReply}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <ReviewForm productSlug={product.slug} />
      </section>

      {similar.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold text-ink">Similar Products</h2>
          <ProductGrid products={similar} />
        </div>
      )}

      {product.pricePKR != null && !outOfStock && !buyVisible && (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-line bg-surface px-5 py-3 md:bottom-0">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 md:px-12">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
              <p className="font-display text-lg font-bold text-battery">
                {formatPrice(product.pricePKR)}
              </p>
            </div>
            <button
              onClick={handleAddToCart}
              className="press min-h-12 shrink-0 cursor-pointer rounded-full bg-battery px-8 py-3 font-semibold text-canvas hover:bg-battery-deep"
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
