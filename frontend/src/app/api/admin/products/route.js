import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { CATEGORIES as SEED_CATEGORIES } from "@/lib/products";
import { productSchema } from "@/lib/validation";
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

async function validCategorySlugs() {
  const slugs = new Set(SEED_CATEGORIES.map((c) => c.slug));
  try {
    const cats = await Category.find({}).select("slug").lean();
    cats.forEach((c) => slugs.add(c.slug));
  } catch {
    // DB category read failing must not block product creation.
  }
  return slugs;
}

// GET /api/admin/products — admin list (includes inactive), newest first.
export async function GET(request) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  try {
    await connectDB();
    const total = await Product.countDocuments();
    const docs = await Product.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return json({
      products: docs.map(serialize),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      source: "db",
    });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// POST /api/admin/products — create a product. Slug is generated from the
// name when left blank. pricePKR may be null (no price yet); the admin
// form requires a price before the product goes live.
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
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid product.", 400);
  }
  const data = parsed.data;
  const slug = slugify(data.slug || data.name);
  if (!slug) return jsonError("Could not make a URL slug from the name.", 400);
  try {
    await connectDB();
    const slugs = await validCategorySlugs();
    if (!slugs.has(data.category)) {
      return jsonError(`Unknown category: ${data.category}.`, 400);
    }
    const existing = await Product.findOne({ slug }).select("_id").lean();
    if (existing) return jsonError(`A product with slug "${slug}" already exists.`, 409);
    const product = await Product.create({
      ...data,
      slug,
      specs: data.specs || {},
    });
    // Audit C1: a new product must reach the storefront without a redeploy.
    revalidatePath("/", "page");
    revalidatePath("/collections/[slug]", "page");
    revalidatePath("/product/[slug]", "page");
    return json({ product: serialize(product) }, 201);
  } catch (err) {
    return dbErrorResponse(err);
  }
}
