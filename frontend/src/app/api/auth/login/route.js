import bcrypt from "bcryptjs";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import User from "@/models/User";
import { loginSchema } from "@/lib/validation";
import { json, jsonError, dbNotConfiguredError } from "@/lib/api-helpers";
import { isAuthConfigured, publicUser, setAuthCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/login — checks the bcrypt hash, sets an httpOnly JWT cookie
// (7 days). Returns only { user: { id, name, email, phone, role } } — the
// password hash is never returned. Wrong credentials → 401, same message
// for unknown email and wrong password (no account enumeration).
export async function POST(request) {
  if (!isDbConfigured() || !isAuthConfigured()) return dbNotConfiguredError();
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid details.", 400);
  }
  const { email, password } = parsed.data;
  await connectDB();
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) return jsonError("Email or password is incorrect.", 401);
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return jsonError("Email or password is incorrect.", 401);
  const response = json({ user: publicUser(user) });
  return setAuthCookie(response, user);
}
