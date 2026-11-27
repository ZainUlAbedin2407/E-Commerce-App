import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Brand from "@/models/Brand";
import Product from "@/models/Product";
import { brandSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { json, jsonError, slugify, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(doc) {
  const b = doc.toObject ? doc.toObject() : doc;
  return { ...b, id: String(b._id), _id: undefined };
}

// GET /api/admin/brands — admin list, name order.
export async function GET(request) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  try {
    await connectDB();
    const docs = await Brand.find({}).sort({ name: 1 }).lean();
    const counts = await Product.aggregate([
      { $match: { active: true, brandId: { $ne: null } } },
      { $group: { _id: "$brandId", count: { $sum: 1 } } },
    ]);
    const countById = new Map(counts.map((c) => [String(c._id), c.count]));
    return json({
      brands: docs.map((b) => ({ ...serialize(b), productCount: countById.get(String(b._id)) || 0 })),
    });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// POST /api/admin/brands — create. Slug is generated from the name
// when left blank.
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
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid brand.", 400);
  }
  const slug = slugify(parsed.data.slug || parsed.data.name);
  if (!slug) return jsonError("Could not make a URL slug from the name.", 400);
  try {
    await connectDB();
    const existing = await Brand.findOne({ slug }).select("_id").lean();
    if (existing) return jsonError(`A brand with slug "${slug}" already exists.`, 409);
    const brand = await Brand.create({ ...parsed.data, slug });
    revalidatePath("/brands", "page");
    return json({ brand: serialize(brand) }, 201);
  } catch (err) {
    return dbErrorResponse(err);
  }
}
