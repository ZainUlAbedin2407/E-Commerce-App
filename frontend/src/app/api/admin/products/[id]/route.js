import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Product from "@/models/Product";
import { productUpdateSchema } from "@/lib/validation";
import { json, jsonError, slugify, dbNotConfiguredError } from "@/lib/api-helpers";
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
  const { error } = requireAdmin(request);
  if (error) return error;
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { id } = await params;
  await connectDB();
  const product = await findProduct(id);
  if (!product) return jsonError("Product not found.", 404);
  return json({ product: serialize(product) });
}

// PATCH /api/admin/products/[id] — id is the Mongo _id or the slug.
// Only the fields sent are changed; pricePKR may be set back to null.
export async function PATCH(request, { params }) {
  const { error } = requireAdmin(request);
  if (error) return error;
  if (!isDbConfigured()) return dbNotConfiguredError();
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
  await connectDB();
  const product = await findProduct(id);
  if (!product) return jsonError("Product not found.", 404);
  const data = parsed.data;
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
  Object.assign(product, data);
  await product.save();
  return json({ product: serialize(product) });
}

// DELETE /api/admin/products/[id] — hard delete. Orders keep their own
// item snapshots, so past orders are unaffected.
export async function DELETE(request, { params }) {
  const { error } = requireAdmin(request);
  if (error) return error;
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { id } = await params;
  await connectDB();
  const product = await findProduct(id);
  if (!product) return jsonError("Product not found.", 404);
  await product.deleteOne();
  return json({ ok: true });
}
