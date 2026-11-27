import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import User from "@/models/User";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin, publicUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/admin/users/[id] — change a user's role (audit L8).
// Guards: an admin cannot change their own role (no self-lockout), and
// the last remaining admin cannot be demoted.
export async function PATCH(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { user, error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  const role = body?.role;
  if (role !== "admin" && role !== "customer") {
    return jsonError("Role must be 'admin' or 'customer'.", 400);
  }
  try {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return jsonError("User not found.", 404);
    }
    const target = await User.findById(id);
    if (!target) return jsonError("User not found.", 404);
    if (String(target._id) === user.id) {
      return jsonError("You cannot change your own role.", 400);
    }
    if (target.role === "admin" && role === "customer") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return jsonError("This is the only admin account. Promote someone else first.", 400);
      }
    }
    target.role = role;
    await target.save();
    return json({ user: publicUser(target) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
