import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Category from "@/models/Category";
import { collectionUpdateSchema } from "@/lib/validation";
import { resolveProductIds, serializeDoc } from "@/lib/admin-helpers";
import { revalidatePath } from "next/cache";
import { json, jsonError, slugify, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function findCollection(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const byId = await Category.findById(id);
    if (byId) return byId;
  }
  return Category.findOne({ slug: id });
}

// GET /api/admin/collections/[id] — id is the Mongo _id or the slug.
export async function GET(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const collection = await findCollection(id);
    if (!collection) return jsonError("Collection not found.", 404);
    return json({ collection: serializeDoc(collection) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// PATCH /api/admin/collections/[id] — only the fields sent are changed.
// products (ids or slugs) replace the manual list when sent.
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
  const parsed = collectionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid collection.", 400);
  }
  try {
    await connectDB();
    const collection = await findCollection(id);
    if (!collection) return jsonError("Collection not found.", 404);
    const data = parsed.data;
    const sent = new Set(Object.keys(body));
    if (data.slug !== undefined) {
      const slug = slugify(data.slug || collection.name);
      if (slug !== collection.slug) {
        const clash = await Category.findOne({ slug }).select("_id").lean();
        if (clash) return jsonError(`A collection with slug "${slug}" already exists.`, 409);
        data.slug = slug;
      } else {
        delete data.slug;
      }
    }
    if (sent.has("products")) {
      const { ids, missing } = await resolveProductIds(data.products || []);
      if (missing.length) {
        return jsonError(`Unknown products: ${missing.join(", ")}.`, 400);
      }
      data.products = ids;
    }
    for (const [key, value] of Object.entries(data)) {
      if (sent.has(key)) collection[key] = value;
    }
    await collection.save();
    revalidatePath("/collections/[slug]", "page");
    return json({ collection: serializeDoc(collection) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// DELETE /api/admin/collections/[id] — the category is removed; products
// keep their category slug string, so the shop page shows "Coming soon"
// instead of breaking.
export async function DELETE(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const collection = await findCollection(id);
    if (!collection) return jsonError("Collection not found.", 404);
    await collection.deleteOne();
    revalidatePath("/collections/[slug]", "page");
    return json({ ok: true });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
