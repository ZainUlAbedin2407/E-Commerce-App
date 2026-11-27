import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Review from "@/models/Review";
import { reviewPatchSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(doc) {
  const r = doc.toObject ? doc.toObject() : doc;
  return { ...r, id: String(r._id), _id: undefined };
}

async function findReview(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Review.findById(id);
}

// GET /api/admin/reviews/[id]
export async function GET(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const review = await findReview(id);
    if (!review) return jsonError("Review not found.", 404);
    return json({ review: serialize(review) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// PATCH /api/admin/reviews/[id] — approve, reject, or reply publicly
// (adminReply), and set the verified flag. Only sent fields change.
export async function PATCH(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  const parsed = reviewPatchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid review update.", 400);
  }
  try {
    await connectDB();
    const review = await findReview(id);
    if (!review) return jsonError("Review not found.", 404);
    const sent = new Set(Object.keys(body));
    for (const [key, value] of Object.entries(parsed.data)) {
      if (sent.has(key) && value !== undefined) review[key] = value;
    }
    await review.save();
    revalidatePath("/product/[slug]", "page");
    revalidatePath("/reviews", "page");
    return json({ review: serialize(review) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// DELETE /api/admin/reviews/[id]
export async function DELETE(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const review = await findReview(id);
    if (!review) return jsonError("Review not found.", 404);
    await review.deleteOne();
    revalidatePath("/product/[slug]", "page");
    revalidatePath("/reviews", "page");
    return json({ ok: true });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
