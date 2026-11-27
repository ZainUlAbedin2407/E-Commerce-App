import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Review from "@/models/Review";
import Product from "@/models/Product";
import { reviewAdminAddSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(doc) {
  const r = doc.toObject ? doc.toObject() : doc;
  return { ...r, id: String(r._id), _id: undefined };
}

// GET /api/admin/reviews?status=&product=<slug>&source=&rating= —
// moderation queue, newest first.
export async function GET(request) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const productSlug = searchParams.get("product") || "";
  const source = searchParams.get("source") || "";
  const rating = Number(searchParams.get("rating") || "");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  try {
    await connectDB();
    const filter = {};
    if (status) filter.status = status;
    if (source) filter.source = source;
    if (rating >= 1 && rating <= 5) filter.rating = rating;
    if (productSlug) {
      const product = await Product.findOne({ slug: productSlug }).select("_id slug").lean();
      if (!product) return json({ reviews: [], total: 0, page, pages: 1 });
      filter.productId = product._id;
    }
    const total = await Review.countDocuments(filter);
    const docs = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("productId", "slug name")
      .lean();
    return json({
      reviews: docs.map((r) => ({
        ...serialize(r),
        productSlug: r.productId?.slug || "",
        productName: r.productId?.name || "",
      })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// POST /api/admin/reviews — the admin adds a WhatsApp/social review by
// hand (V3 plan sec 6). The form states explicitly that the admin
// confirms the buyer, so the review is verified true and approved at
// once. The customer's own words are pasted exactly as written.
export async function POST(request) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  const parsed = reviewAdminAddSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid review.", 400);
  }
  const { productSlug, name, rating, title, body: reviewBody, source } = parsed.data;
  try {
    await connectDB();
    const product = await Product.findOne({ slug: productSlug.toLowerCase() }).select("_id slug").lean();
    if (!product) return jsonError("Product not found.", 404);
    const review = await Review.create({
      productId: product._id,
      name,
      rating,
      title: title || "",
      body: reviewBody,
      photos: [],
      source,
      status: "approved",
      verified: true,
    });
    revalidatePath("/product/[slug]", "page");
    revalidatePath("/reviews", "page");
    return json({ review: serialize(review) }, 201);
  } catch (err) {
    return dbErrorResponse(err);
  }
}
