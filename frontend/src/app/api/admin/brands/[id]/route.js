import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Brand from "@/models/Brand";
import { brandUpdateSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { json, jsonError, slugify, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(doc) {
  const b = doc.toObject ? doc.toObject() : doc;
  return { ...b, id: String(b._id), _id: undefined };
}

async function findBrand(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const byId = await Brand.findById(id);
    if (byId) return byId;
  }
  return Brand.findOne({ slug: id });
}

// GET /api/admin/brands/[id] — id is the Mongo _id or the slug.
export async function GET(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const brand = await findBrand(id);
    if (!brand) return jsonError("Brand not found.", 404);
    return json({ brand: serialize(brand) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// PATCH /api/admin/brands/[id] — only the fields sent are changed.
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
  const parsed = brandUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid brand.", 400);
  }
  try {
    await connectDB();
    const brand = await findBrand(id);
    if (!brand) return jsonError("Brand not found.", 404);
    const data = parsed.data;
    const sent = new Set(Object.keys(body));
    if (data.slug !== undefined) {
      const slug = slugify(data.slug || brand.name);
      if (slug !== brand.slug) {
        const clash = await Brand.findOne({ slug }).select("_id").lean();
        if (clash) return jsonError(`A brand with slug "${slug}" already exists.`, 409);
        data.slug = slug;
      } else {
        delete data.slug;
      }
    }
    for (const [key, value] of Object.entries(data)) {
      if (sent.has(key)) brand[key] = value;
    }
    await brand.save();
    revalidatePath("/brands", "page");
    return json({ brand: serialize(brand) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// DELETE /api/admin/brands/[id] — products keep their legacy brand
// string; their brandId is cleared so they do not point at a dead brand.
export async function DELETE(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const brand = await findBrand(id);
    if (!brand) return jsonError("Brand not found.", 404);
    const { default: Product } = await import("@/models/Product");
    await Product.updateMany({ brandId: brand._id }, { $set: { brandId: null } });
    await brand.deleteOne();
    revalidatePath("/brands", "page");
    return json({ ok: true });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
