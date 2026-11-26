import { connectDB, isDbConfigured } from "@/lib/mongodb";
import User from "@/models/User";
import { json, jsonError, dbNotConfiguredError } from "@/lib/api-helpers";
import { getSessionFromRequest, publicUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/auth/me — who is signed in, from the httpOnly cookie.
// No cookie → 401. No DB → 503 (the header/navbar then shows guest links).
export async function GET(request) {
  const session = getSessionFromRequest(request);
  if (!session) return jsonError("Not signed in.", 401);
  if (!isDbConfigured()) return dbNotConfiguredError();
  await connectDB();
  const user = await User.findById(session.id).lean();
  if (!user) return jsonError("Not signed in.", 401);
  return json({ user: publicUser(user) });
}
