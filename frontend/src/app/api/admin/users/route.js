import { connectDB, isDbConfigured } from "@/lib/mongodb";
import User from "@/models/User";
import { json, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin, publicUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/users — registered accounts. Password hashes are never
// selected or returned (passwordHash is select:false in the schema).
export async function GET(request) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  try {
    await connectDB();
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    return json({ users: users.map(publicUser) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
