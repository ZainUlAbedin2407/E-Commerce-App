import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import HomepageSection from "@/models/HomepageSection";
import { homepageSectionUpdateSchema } from "@/lib/validation";
import { resolveProductIds, serializeDoc } from "@/lib/admin-helpers";
import { revalidatePath } from "next/cache";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function findSection(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const byId = await HomepageSection.findById(id);
    if (byId) return byId;
  }
  return null;
}

// GET /api/admin/sections/[id]
export async function GET(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const section = await findSection(id);
    if (!section) return jsonError("Section not found.", 404);
    return json({ section: serializeDoc(section) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// PATCH /api/admin/sections/[id] — only the fields sent are changed.
// productIds (ids or slugs) replace the manual list when sent.
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
  const parsed = homepageSectionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid section.", 400);
  }
  try {
    await connectDB();
    const section = await findSection(id);
    if (!section) return jsonError("Section not found.", 404);
    const data = parsed.data;
    const sent = new Set(Object.keys(body));
    if (sent.has("productIds")) {
      const { ids, missing } = await resolveProductIds(data.productIds || []);
      if (missing.length) {
        return jsonError(`Unknown products: ${missing.join(", ")}.`, 400);
      }
      data.productIds = ids;
    }
    for (const [key, value] of Object.entries(data)) {
      if (sent.has(key)) section[key] = value;
    }
    await section.save();
    revalidatePath("/", "page");
    return json({ section: serializeDoc(section) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// DELETE /api/admin/sections/[id]
export async function DELETE(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const section = await findSection(id);
    if (!section) return jsonError("Section not found.", 404);
    await section.deleteOne();
    revalidatePath("/", "page");
    return json({ ok: true });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
