import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Category from "@/models/Category";
import { collectionSchema } from "@/lib/validation";
import { resolveProductIds, serializeDoc } from "@/lib/admin-helpers";
import { revalidatePath } from "next/cache";
import { json, jsonError, slugify, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Collections are Categories (see src/models/Category.js): the category
// taxonomy already feeds /collections/[slug], so the admin manages
// collections here. A manual collection is a hand-picked ordered product
// list; a rule collection resolves from its rule at read time.

// GET /api/admin/collections — admin list, sortOrder.
export async function GET(request) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  try {
    await connectDB();
    const docs = await Category.find({}).sort({ sortOrder: 1, name: 1 }).lean();
    return json({ collections: docs.map(serializeDoc) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// POST /api/admin/collections — create. Slug is generated from the name
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
  const parsed = collectionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid collection.", 400);
  }
  const slug = slugify(parsed.data.slug || parsed.data.name);
  if (!slug) return jsonError("Could not make a URL slug from the name.", 400);
  try {
    await connectDB();
    const existing = await Category.findOne({ slug }).select("_id").lean();
    if (existing) return jsonError(`A collection with slug "${slug}" already exists.`, 409);
    const { ids, missing } = await resolveProductIds(parsed.data.products || []);
    if (missing.length) {
      return jsonError(`Unknown products: ${missing.join(", ")}.`, 400);
    }
    const collection = await Category.create({ ...parsed.data, slug, products: ids });
    revalidatePath("/collections/[slug]", "page");
    return json({ collection: serializeDoc(collection) }, 201);
  } catch (err) {
    return dbErrorResponse(err);
  }
}
