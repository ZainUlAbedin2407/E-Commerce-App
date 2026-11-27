import { connectDB, isDbConfigured } from "@/lib/mongodb";
import HomepageSection from "@/models/HomepageSection";
import { homepageSectionSchema } from "@/lib/validation";
import { resolveProductIds, serializeDoc } from "@/lib/admin-helpers";
import { revalidatePath } from "next/cache";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/sections — admin list, order ascending.
export async function GET(request) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  try {
    await connectDB();
    const docs = await HomepageSection.find({}).sort({ order: 1, createdAt: 1 }).lean();
    return json({ sections: docs.map(serializeDoc) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// POST /api/admin/sections — create a homepage section. productIds may
// be ObjectId strings or product slugs.
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
  const parsed = homepageSectionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid section.", 400);
  }
  try {
    await connectDB();
    const { ids, missing } = await resolveProductIds(parsed.data.productIds || []);
    if (missing.length) {
      return jsonError(`Unknown products: ${missing.join(", ")}.`, 400);
    }
    const section = await HomepageSection.create({ ...parsed.data, productIds: ids });
    revalidatePath("/", "page");
    return json({ section: serializeDoc(section) }, 201);
  } catch (err) {
    return dbErrorResponse(err);
  }
}
