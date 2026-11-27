import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import FilterDefinition from "@/models/FilterDefinition";
import { filterDefinitionUpdateSchema } from "@/lib/validation";
import { serializeDoc } from "@/lib/admin-helpers";
import { revalidatePath } from "next/cache";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function findFilter(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const byId = await FilterDefinition.findById(id);
    if (byId) return byId;
  }
  return FilterDefinition.findOne({ key: id });
}

// GET /api/admin/filters/[id] — id is the Mongo _id or the key.
export async function GET(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const filter = await findFilter(id);
    if (!filter) return jsonError("Filter not found.", 404);
    return json({ filter: serializeDoc(filter) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// PATCH /api/admin/filters/[id] — only the fields sent are changed.
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
  const parsed = filterDefinitionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid filter.", 400);
  }
  try {
    await connectDB();
    const filter = await findFilter(id);
    if (!filter) return jsonError("Filter not found.", 404);
    const data = parsed.data;
    const sent = new Set(Object.keys(body));
    if (data.key !== undefined && data.key !== filter.key) {
      const clash = await FilterDefinition.findOne({ key: data.key }).select("_id").lean();
      if (clash) return jsonError(`A filter with key "${data.key}" already exists.`, 409);
    }
    for (const [key, value] of Object.entries(data)) {
      if (sent.has(key)) filter[key] = value;
    }
    await filter.save();
    revalidatePath("/collections/[slug]", "page");
    return json({ filter: serializeDoc(filter) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// DELETE /api/admin/filters/[id]
export async function DELETE(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const filter = await findFilter(id);
    if (!filter) return jsonError("Filter not found.", 404);
    await filter.deleteOne();
    revalidatePath("/collections/[slug]", "page");
    return json({ ok: true });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
