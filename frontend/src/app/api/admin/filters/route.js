import { connectDB, isDbConfigured } from "@/lib/mongodb";
import FilterDefinition from "@/models/FilterDefinition";
import { filterDefinitionSchema } from "@/lib/validation";
import { serializeDoc } from "@/lib/admin-helpers";
import { revalidatePath } from "next/cache";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/filters — admin list (including inactive), sortOrder.
export async function GET(request) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  try {
    await connectDB();
    const docs = await FilterDefinition.find({}).sort({ sortOrder: 1, key: 1 }).lean();
    return json({ filters: docs.map(serializeDoc) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// POST /api/admin/filters — create. The key is unique.
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
  const parsed = filterDefinitionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid filter.", 400);
  }
  try {
    await connectDB();
    const existing = await FilterDefinition.findOne({ key: parsed.data.key }).select("_id").lean();
    if (existing) return jsonError(`A filter with key "${parsed.data.key}" already exists.`, 409);
    const filter = await FilterDefinition.create(parsed.data);
    revalidatePath("/collections/[slug]", "page");
    return json({ filter: serializeDoc(filter) }, 201);
  } catch (err) {
    return dbErrorResponse(err);
  }
}
