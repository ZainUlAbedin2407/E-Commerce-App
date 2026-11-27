import bcrypt from "bcryptjs";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import User from "@/models/User";
import { registerSchema } from "@/lib/validation";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse, sameOriginError } from "@/lib/api-helpers";
import { isAuthConfigured, publicUser, setAuthCookie } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/register — creates the account and signs the user in
// (httpOnly cookie). Duplicate email → 409. No DB / no JWT secret → 503,
// never a fake account.
export async function POST(request) {
  // Audit M3: state-changing requests must come from our own origin.
  const originErr = sameOriginError(request);
  if (originErr) return originErr;
  // Audit H3: 5 registrations per minute per IP.
  const rl = rateLimit(`register:${clientIp(request)}`, { limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return jsonError("Too many requests. Please try again shortly.", 429, {
      code: "rate_limited",
    });
  }
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
  try {
    await connectDB();
    const existing = await User.findOne({ email }).select("_id").lean();
    if (existing) {
      return jsonError("An account with this email already exists. Try logging in.", 409);
    }
    // Audit L1: bcrypt cost 12 (was 10). Existing hashes still verify.
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, phone, passwordHash, role: "customer" });
    const response = json({ user: publicUser(user) }, 201);
    return setAuthCookie(response, user);
  } catch (err) {
    return dbErrorResponse(err);
  }
}
