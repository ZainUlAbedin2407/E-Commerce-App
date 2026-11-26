import bcrypt from "bcryptjs";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import User from "@/models/User";
import { registerSchema } from "@/lib/validation";
import { json, jsonError, dbNotConfiguredError } from "@/lib/api-helpers";
import { isAuthConfigured, publicUser, setAuthCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/register — creates the account and signs the user in
// (httpOnly cookie). Duplicate email → 409. No DB / no JWT secret → 503,
// never a fake account.
export async function POST(request) {
  if (!isDbConfigured() || !isAuthConfigured()) return dbNotConfiguredError();
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid details.", 400);
  }
  const { name, email, phone, password } = parsed.data;
  await connectDB();
  const existing = await User.findOne({ email }).select("_id").lean();
  if (existing) {
    return jsonError("An account with this email already exists. Try logging in.", 409);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, phone, passwordHash, role: "customer" });
  const response = json({ user: publicUser(user) }, 201);
  return setAuthCookie(response, user);
}
