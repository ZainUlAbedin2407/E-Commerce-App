"use client";

import { useEffect, useState } from "react";
import {
  apiJson,
  btnGhost,
  btnPrimary,
  cardCls,
  Field,
  fmtDate,
  inputCls,
  Notice,
  useCatalogProducts,
} from "@/components/AdminUI";

function Stars({ rating }) {
  return (
    <span className="text-battery" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

function sourceLabel(source) {
  if (source === "whatsapp") return "via WhatsApp";
  if (source === "social") return "via social media";
  return "Website";
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [busyId, setBusyId] = useState("");
  const [replyFor, setReplyFor] = useState("");
  const [replyText, setReplyText] = useState("");
  const [add, setAdd] = useState({ productSlug: "", name: "", rating: 5, title: "", body: "", source: "whatsapp" });
  const [addErrors, setAddErrors] = useState({});
  const [addBusy, setAddBusy] = useState(false);
  const { products } = useCatalogProducts();

  const load = () => {
    setError("");
    setNotConfigured(false);
    const qs = new URLSearchParams({ limit: "50" });
    if (statusFilter) qs.set("status", statusFilter);
    if (sourceFilter) qs.set("source", sourceFilter);
    if (productFilter) qs.set("product", productFilter);
    if (ratingFilter) qs.set("rating", ratingFilter);
    fetch(`/api/admin/reviews?${qs}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          if (data.code === "db_not_configured") setNotConfigured(true);
          else setError(data.error || "Could not load reviews.");
          setReviews([]);
        } else {
          setReviews(data.reviews || []);
        }
      })
      .catch(() => {
        setError("Could not load reviews. Check your connection.");
        setReviews([]);
      })
      .finally(() => setLoaded(true));
  };

  // All filters run on the server, including rating.
  useEffect(load, [statusFilter, sourceFilter, productFilter, ratingFilter]);

  const patch = async (review, body, okMsg) => {
    const id = review.id || review._id;
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      const data = await apiJson(`/api/admin/reviews/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setReviews((list) => list.map((r) => ((r.id || r._id) === id ? data.review : r)));
      setNotice(okMsg);
    } catch (err) {
      setError(err.message || "Could not update the review.");
    } finally {
      setBusyId("");
    }
  };

  const submitReply = async (review) => {
    if (!replyText.trim()) return;
    await patch(review, { adminReply: replyText.trim() }, "Reply saved. It shows under the review on the shop.");
    setReplyFor("");
    setReplyText("");
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const next = {};
    if (!add.productSlug) next.productSlug = "Pick a product.";
    if (add.name.trim().length < 2) next.name = "Enter the customer name.";
    if (add.body.trim().length < 2) next.body = "Paste the customer words.";
    if (Object.keys(next).length > 0) {
      setAddErrors(next);
      return;
    }
    setAddBusy(true);
    try {
      await apiJson("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: add.productSlug,
          name: add.name.trim(),
          rating: Number(add.rating),
          title: add.title.trim(),
          body: add.body.trim(),
          source: add.source,
        }),
      });
      setNotice("Review added. It is verified and approved, and shows on the product page.");
      setAdd({ productSlug: "", name: "", rating: 5, title: "", body: "", source: "whatsapp" });
      setAddErrors({});
      load();
    } catch (err) {
      setError(err.message || "Could not add the review.");
    } finally {
      setAddBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-2 font-display text-2xl font-bold text-ink">Reviews</h2>
      <p className="mb-6 text-sm text-muted">
        Moderation queue for website reviews, and the place to add reviews
        customers sent on WhatsApp or social media. Never invent a review.
        Only add words a real customer actually wrote.
      </p>
      {notConfigured && (
        <div className={`${cardCls} mb-4 text-center`}>
          <p className="mb-2 font-display text-lg font-semibold text-ink">Database not connected</p>
          <p className="text-sm text-muted">Set MONGODB_URI to moderate reviews here.</p>
        </div>
      )}
      <Notice kind="error">{error}</Notice>
      <Notice kind="success">{notice}</Notice>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls} aria-label="Filter by status">
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={inputCls} aria-label="Filter by source">
              <option value="">All sources</option>
              <option value="website">Website</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="social">Social media</option>
            </select>
            <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className={inputCls} aria-label="Filter by product">
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
            <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className={inputCls} aria-label="Filter by rating">
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} star{n === 1 ? "" : "s"}</option>
              ))}
            </select>
          </div>

          {!loaded ? (
            <p className="text-muted">Loading...</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted">No reviews match the filters.</p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((r) => {
                const id = r.id || r._id;
                return (
                  <li key={id} className={cardCls}>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{r.productName || r.productSlug || "Unknown product"}</span>
                      {r.verified && (
                        <span className="rounded bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">Verified buyer</span>
                      )}
                      <span className="rounded bg-raised px-2 py-0.5 text-xs font-semibold text-muted">{sourceLabel(r.source)}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          r.status === "approved"
                            ? "bg-success/15 text-success"
                            : r.status === "rejected"
                              ? "bg-danger/15 text-danger"
                              : "bg-battery/15 text-battery"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted">
                      <Stars rating={r.rating || 0} /> · {r.name} · {fmtDate(r.createdAt)}
                      {r.orderNo ? ` · Order ${r.orderNo}` : ""}
                    </p>
                    {r.title && <p className="mt-2 font-semibold text-ink">{r.title}</p>}
                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{r.body}</p>
                    {r.adminReply && (
                      <p className="mt-3 rounded-xl border border-line bg-raised p-3 text-sm text-ink">
                        <span className="font-semibold">Reply from AI Communication: </span>
                        {r.adminReply}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {r.status !== "approved" && (
                        <button
                          type="button"
                          disabled={busyId === id}
                          onClick={() => patch(r, { status: "approved" }, "Review approved. It now shows on the shop.")}
                          className={btnPrimary}
                        >
                          Approve
                        </button>
                      )}
                      {r.status !== "rejected" && (
                        <button
                          type="button"
                          disabled={busyId === id}
                          onClick={() => patch(r, { status: "rejected" }, "Review rejected. It is hidden from the shop.")}
                          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-danger/50 bg-danger/10 px-4 py-2 font-semibold text-danger hover:bg-danger/20 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === id}
                        onClick={() => {
                          setReplyFor(replyFor === id ? "" : id);
                          setReplyText(r.adminReply || "");
                        }}
                        className={btnGhost}
                      >
                        {replyFor === id ? "Close reply" : "Reply"}
                      </button>
                    </div>
                    {replyFor === id && (
                      <div className="mt-3 space-y-3">
                        <Field label="Public reply" hint="Shown under the review on the product page.">
                          <textarea
                            rows={3}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className={inputCls}
                            placeholder="Thank you for the kind words..."
                          />
                        </Field>
                        <button
                          type="button"
                          disabled={busyId === id || !replyText.trim()}
                          onClick={() => submitReply(r)}
                          className={btnPrimary}
                        >
                          Save reply
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className={cardCls}>
          <h3 className="mb-1 font-display text-xl font-semibold text-ink">Add a review</h3>
          <p className="mb-4 text-sm text-muted">
            For a customer who praised a product on WhatsApp or social media.
            Paste their own words exactly as written, never rewritten. The
            review is saved as verified and approved, because you confirmed
            the buyer yourself.
          </p>
          <form onSubmit={handleAdd} className="space-y-4">
            <Field label="Product *" error={addErrors.productSlug} hint="The review needs a product that exists in the catalogue. Add the product first when it is missing.">
              <select
                value={add.productSlug}
                onChange={(e) => setAdd((a) => ({ ...a, productSlug: e.target.value }))}
                className={inputCls}
              >
                <option value="">Pick a product...</option>
                {products.map((p) => (
                  <option key={p.slug} value={p.slug}>{p.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Customer name *" error={addErrors.name}>
              <input
                value={add.name}
                onChange={(e) => setAdd((a) => ({ ...a, name: e.target.value }))}
                className={inputCls}
                placeholder="e.g. Customer"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Rating *">
                <select
                  value={add.rating}
                  onChange={(e) => setAdd((a) => ({ ...a, rating: Number(e.target.value) }))}
                  className={inputCls}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} star{n === 1 ? "" : "s"}</option>
                  ))}
                </select>
              </Field>
              <Field label="Source *">
                <select
                  value={add.source}
                  onChange={(e) => setAdd((a) => ({ ...a, source: e.target.value }))}
                  className={inputCls}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="social">Social media</option>
                </select>
              </Field>
            </div>
            <Field label="Title (optional)">
              <input
                value={add.title}
                onChange={(e) => setAdd((a) => ({ ...a, title: e.target.value }))}
                className={inputCls}
                placeholder="Short headline, when the customer wrote one"
                maxLength={200}
              />
            </Field>
            <Field label="Customer words *" error={addErrors.body} hint="Paste exactly what the customer wrote. Do not rewrite it.">
              <textarea
                rows={5}
                value={add.body}
                onChange={(e) => setAdd((a) => ({ ...a, body: e.target.value }))}
                className={inputCls}
                placeholder="Paste the customer message here, word for word."
              />
            </Field>
            <button type="submit" disabled={addBusy} className={btnPrimary}>
              {addBusy ? "Adding..." : "Add review"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
