import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Review from "@/models/Review";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { getApprovedReviews, DbUnavailableError } from "@/lib/catalog";
import { reviewSubmitSchema } from "@/lib/validation";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/reviews?product=<slug>&rating=<n>&source=<website|whatsapp|social>
// Approved reviews only, newest first, plus the aggregate
// {average, count, byRating}. Without a DB, the seeded reviews from
// the local defaults are returned so the PDP renders in dev.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const product = searchParams.get("product") || "";
  const rating = searchParams.get("rating");
  const source = searchParams.get("source") || "";
  if (source && !["website", "whatsapp", "social"].includes(source)) {
    return jsonError("Unknown review source.", 400);
  }
  try {
    const result = await getApprovedReviews({
      productSlug: product,
      rating: rating != null && rating !== "" ? Number(rating) : null,
      source,
    });
    return json(result);
  } catch (err) {
    if (err instanceof DbUnavailableError || err?.code === "db_unavailable") {
      return dbErrorResponse(err);
    }
    throw err;
  }
}

// POST /api/reviews — website review submit (guest-first, no account
// needed). Body: {productSlug, orderNo, phone, name, rating, title, body}.
// The order number + phone are checked against a Delivered order: a
// match means verified true and auto-approved (auto-publish verified
// reviews); otherwise verified false and status pending (moderation
// queue). The response never exposes other customers' data: no phone,
// no orderNo, no order details. Without a DB, 503 db_not_configured.
export async function POST(request) {
  const rl = rateLimit(`reviews:${clientIp(request)}`, { limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return jsonError("Too many requests. Please try again shortly.", 429, {
      code: "rate_limited",
    });
  }
  if (!isDbConfigured()) return dbNotConfiguredError();
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  const parsed = reviewSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid review.", 400);
  }
  const { productSlug, orderNo, phone, name, rating, title, body: reviewBody } = parsed.data;
  try {
    await connectDB();
    const product = await Product.findOne({ slug: productSlug.toLowerCase() }).select("_id slug").lean();
    if (!product) return jsonError("Product not found.", 404);
    // Verify against a Delivered order with this order number + phone.
    // Phone comparison ignores dashes/spaces, like the claim route.
    let verified = false;
    if (orderNo) {
      const order = await Order.findOne({
        orderNo: orderNo.trim().toUpperCase(),
        status: "Delivered",
      })
        .select("customer.phone")
        .lean();
      const norm = (p) => String(p || "").replace(/[\s-]/g, "");
      if (order && norm(order.customer?.phone) === norm(phone)) verified = true;
    }
    const review = await Review.create({
      productId: new mongoose.Types.ObjectId(product._id),
      orderNo: orderNo || "",
      phone,
      name,
      rating,
      title: title || "",
      body: reviewBody,
      photos: [],
      source: "website",
      status: verified ? "approved" : "pending",
      verified,
    });
    return json(
      {
        review: {
          id: String(review._id),
          productSlug: product.slug,
          name: review.name,
          rating: review.rating,
          title: review.title,
          body: review.body,
          source: review.source,
          status: review.status,
          verified: review.verified,
          createdAt: review.createdAt,
        },
      },
      201
    );
  } catch (err) {
    return dbErrorResponse(err);
  }
}
