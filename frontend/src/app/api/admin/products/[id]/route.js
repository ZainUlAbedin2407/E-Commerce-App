import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Product from "@/models/Product";
import { productUpdateSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { json, jsonError, slugify, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(doc) {
  const p = doc.toObject ? doc.toObject() : doc;
  return {
    ...p,
    id: String(p._id),
    _id: undefined,
    specs: p.specs instanceof Map ? Object.fromEntries(p.specs) : p.specs || {},
  };
}

async function findProduct(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const byId = await Product.findById(id);
    if (byId) return byId;
  }
  return Product.findOne({ slug: id });
}

// GET /api/admin/products/[id] — id is the Mongo _id or the slug.
export async function GET(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const product = await findProduct(id);
    if (!product) return jsonError("Product not found.", 404);
    return json({ product: serialize(product) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// PATCH /api/admin/products/[id] — id is the Mongo _id or the slug.
// Only the fields sent are changed; pricePKR may be set back to null.
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
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid product.", 400);
  }
  try {
    await connectDB();
    const product = await findProduct(id);
    if (!product) return jsonError("Product not found.", 404);
    const data = parsed.data;
    // Compare-at check against the EXISTING product (audit L5): the
    // schema refinement only sees the fields this PATCH sends, so a
    // PATCH that sets only compareAt (or only price) is validated here
    // against the stored values of the other field.
    const sent = new Set(Object.keys(body));
    const effectivePrice = sent.has("pricePKR") ? data.pricePKR : product.pricePKR;
    const effectiveCompareAt = sent.has("compareAtPricePKR")
      ? data.compareAtPricePKR
      : product.compareAtPricePKR;
    if (
      effectivePrice != null &&
      effectiveCompareAt != null &&
      effectiveCompareAt <= effectivePrice
    ) {
      return jsonError("Compare-at price must be higher than the price.", 400);
    }
    if (data.slug !== undefined) {
      const slug = slugify(data.slug || product.name);
      if (slug !== product.slug) {
        const clash = await Product.findOne({ slug }).select("_id").lean();
        if (clash) return jsonError(`A product with slug "${slug}" already exists.`, 409);
        data.slug = slug;
      } else {
        delete data.slug;
      }
    }
    if (data.specs !== undefined) data.specs = data.specs || {};
    // Assign ONLY the fields the request actually sent. parsed.data
    // carries zod defaults for omitted fields (e.g. isFeatured: false),
    // and a plain Object.assign would silently reset them. The nullable
    // fields (price/stock) are safe here because explicit null IS sent
    // by the form when the admin clears them (audit C2 follow-up).
    // `sent` is also used by the compare-at check above.
    for (const [key, value] of Object.entries(data)) {
      if (sent.has(key)) product[key] = value;
    }
    await product.save();
    // Audit C1: an edited price must reach the storefront without a redeploy.
    revalidatePath("/", "page");
    revalidatePath("/collections/[slug]", "page");
    revalidatePath("/product/[slug]", "page");
    return json({ product: serialize(product) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// DELETE /api/admin/products/[id] — hard delete. Orders keep their own
// item snapshots, so past orders are unaffected.
export async function DELETE(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const product = await findProduct(id);
    if (!product) return jsonError("Product not found.", 404);
    await product.deleteOne();
    revalidatePath("/", "page");
    revalidatePath("/collections/[slug]", "page");
    revalidatePath("/product/[slug]", "page");
    return json({ ok: true });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
