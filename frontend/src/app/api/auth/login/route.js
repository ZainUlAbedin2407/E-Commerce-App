import bcrypt from "bcryptjs";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import User from "@/models/User";
import { loginSchema } from "@/lib/validation";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse, sameOriginError } from "@/lib/api-helpers";
import { isAuthConfigured, publicUser, setAuthCookie } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// bcrypt hash of a password that can never be a real password (audit L3:
// the dummy comparison for unknown emails).
const DUMMY_HASH = "$2b$10$UXNUb9ors3iqFW62LH4xeuAp5QUDNyrYyz72ZaE89H03hfWuyCHmm";

// POST /api/auth/login — checks the bcrypt hash, sets an httpOnly JWT cookie
// (7 days). Returns only { user: { id, name, email, phone, role } } — the
// password hash is never returned. Wrong credentials → 401, same message
// for unknown email and wrong password (no account enumeration).
export async function POST(request) {
  // Audit M3: state-changing requests must come from our own origin.
  const originErr = sameOriginError(request);
  if (originErr) return originErr;
  // Audit H3: 5 login attempts per minute per IP.
  const rl = rateLimit(`login:${clientIp(request)}`, { limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return jsonError("Too many login attempts. Please try again shortly.", 429, {
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
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid details.", 400);
  }
  const { email, password } = parsed.data;
  try {
    await connectDB();
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      // Audit L3: run the same bcrypt comparison for an unknown email,
      // so the response time does not reveal whether the email exists.
      await bcrypt.compare(password, DUMMY_HASH);
      return jsonError("Email or password is incorrect.", 401);
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return jsonError("Email or password is incorrect.", 401);
    const response = json({ user: publicUser(user) });
    return setAuthCookie(response, user);
  } catch (err) {
    return dbErrorResponse(err);
  }
}
