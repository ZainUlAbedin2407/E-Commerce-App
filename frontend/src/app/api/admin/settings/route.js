import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { settingsUpdateSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The Settings singleton lives under _id "shop". Nested objects
// (socials, announcement, delivery, paymentAccounts) are merged field
// by field so a PATCH that changes one delivery fee does not wipe the
// payment account details Zain entered.
const NESTED = ["socials", "announcement", "delivery", "paymentAccounts"];

function serialize(doc) {
  const s = doc.toObject ? doc.toObject() : doc;
  return { ...s, id: String(s._id), _id: undefined };
}

async function getOrCreateSettings() {
  let doc = await Settings.findById("shop");
  if (!doc) {
    // First read creates the defaults (Mongoose defaults apply).
    doc = await Settings.create({ _id: "shop" });
  }
  return doc;
}

// GET /api/admin/settings — the singleton, creating defaults if missing.
export async function GET(request) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  try {
    await connectDB();
    const doc = await getOrCreateSettings();
    return json({ settings: serialize(doc) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// PATCH /api/admin/settings — updates store, delivery, COD threshold,
// payment methods and paymentAccounts. paymentAccounts are admin-only
// and are NEVER returned by any public route.
export async function PATCH(request) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  const parsed = settingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid settings.", 400);
  }
  try {
    await connectDB();
    const doc = await getOrCreateSettings();
    const data = parsed.data;
    const sent = new Set(Object.keys(body));
    for (const [key, value] of Object.entries(data)) {
      if (!sent.has(key) || value === undefined) continue;
      if (NESTED.includes(key) && value && typeof value === "object") {
        for (const [subKey, subValue] of Object.entries(value)) {
          if (subValue !== undefined) doc[key][subKey] = subValue;
        }
      } else {
        doc[key] = value;
      }
    }
    await doc.save();
    revalidatePath("/", "page");
    revalidatePath("/checkout", "page");
    return json({ settings: serialize(doc) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
