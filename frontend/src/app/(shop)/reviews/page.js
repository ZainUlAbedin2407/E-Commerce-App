"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Stars } from "@/components/ProductCard";

// All approved reviews across products, filterable by product and
// rating. Aggregate stats at the top. Reviews come from /api/reviews,
// both sources in one list, newest first.
export default function ReviewsPage() {
  const [reviews, setReviews] = useState(null);
  const [agg, setAgg] = useState(null);
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState("");
  const [rating, setRating] = useState("");
  const [source, setSource] = useState("");

  useEffect(() => {
    fetch("/api/products?limit=100")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setProducts(d?.products || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (product) params.set("product", product);
    if (rating) params.set("rating", rating);
    if (source) params.set("source", source);
    setReviews(null);
    fetch(`/api/reviews?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setReviews(d.reviews || []);
          setAgg(d.aggregate || null);
        }
      })
      .catch(() => setReviews([]));
  }, [product, rating, source]);

  const nameOf = (slug) => products.find((p) => p.slug === slug)?.name || slug;
  const select =
    "min-h-12 rounded-xl border border-line bg-surface p-3 text-base text-ink";

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-12">
      <h1 className="font-display text-3xl font-bold text-ink">Reviews</h1>
      <p className="mt-2 text-muted">
        Reviews from customers who bought on the website and from customers
        who ordered on WhatsApp before the website. Website reviews are
        verified against a delivered order.
      </p>

      {agg && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <Stars average={agg.average} count={agg.count} />
          <p className="mt-2 text-muted">
            Average {agg.average} out of 5 from {agg.count} review
            {agg.count === 1 ? "" : "s"}.
          </p>
          <div className="mt-3 space-y-1">
            {[5, 4, 3, 2, 1].map((n) => (
              <p key={n} className="text-sm text-muted">
                {n} star{n > 1 ? "s" : ""}: {agg.byRating?.[n] || 0}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <select value={product} onChange={(e) => setProduct(e.target.value)} aria-label="Filter by product" className={`${select} flex-1`}>
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>
        <select value={rating} onChange={(e) => setRating(e.target.value)} aria-label="Filter by rating" className={select}>
          <option value="">Any rating</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>
          ))}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Filter by source" className={select}>
          <option value="">All sources</option>
          <option value="website">Website</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="social">Social media</option>
        </select>
      </div>

      {reviews === null && <div className="skeleton mt-6 h-32 rounded-2xl" />}
      {reviews && reviews.length === 0 && (
        <p className="mt-6 text-muted">No reviews match those filters.</p>
      )}
      {reviews && reviews.length > 0 && (
        <ul className="mt-6 space-y-4">
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
              <p className="mt-1 text-sm text-muted">
                <Link href={`/product/${r.productSlug}`} className="font-semibold text-battery">
                  {nameOf(r.productSlug)}
                </Link>
                {r.createdAt ? `, ${new Date(r.createdAt).toLocaleDateString()}` : ""}
              </p>
              {r.title && <p className="mt-2 font-semibold text-ink">{r.title}</p>}
              <p className="mt-1 text-muted">{r.body}</p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-muted">
        Bought a product on the website? Leave your review on the product page,
        under Reviews. You need your order number and the phone you ordered with.
      </p>
    </div>
  );
}
