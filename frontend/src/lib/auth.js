// Auth helpers — JWT in an httpOnly cookie.
//
// Library choice: `jsonwebtoken` (not `jose`). It is the standard JWT
// library in the MERN stack Zain already knows, it works in the Node.js
// runtime our API routes use, and its API (sign/verify) is one line each.
// `jose` is better for Edge runtimes; we do not use the Edge runtime here.

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { connectDB, isDbConfigured } from "./mongodb";
import { sameOriginError } from "./api-helpers";

export const AUTH_COOKIE = "ai-auth";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days, in seconds

export function isAuthConfigured() {
  return Boolean(process.env.JWT_SECRET);
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "Auth not configured: set JWT_SECRET in .env.local (generate one with: openssl rand -base64 32). See .env.example."
    );
  }
  return secret;
}

export function signToken(user) {
  return jwt.sign(
    { id: String(user._id || user.id), email: user.email, role: user.role },
    getSecret(),
    { expiresIn: "7d" }
  );
}

export function verifyToken(token) {
  try {
    // Audit L2: pin the algorithm. HS256 is the only algorithm we ever
    // sign with; without the pin, a token with alg "none" (or an
    // algorithm-confusion attack) is a theoretical risk if the secret
    // handling ever changed.
    return jwt.verify(token, getSecret(), { algorithms: ["HS256"] });
  } catch {
    return null;
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

export function setAuthCookie(response, user) {
  const token = signToken(user);
  response.cookies.set(AUTH_COOKIE, token, cookieOptions());
  return response;
}

export function clearAuthCookie(response) {
  response.cookies.set(AUTH_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  return response;
}

// --- Server-component / layout use (next/headers) ---
export async function getSession() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// --- Route-handler use (request.cookies) ---
export function getSessionFromRequest(request) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function requireAuth(request) {
  const user = getSessionFromRequest(request);
  if (!user) return { user: null, error: jsonError("Not signed in.", 401) };
  return { user, error: null };
}

export async function requireAdmin(request) {
  // Audit M3: cookie-authenticated state-changing requests must come
  // from our own origin (GETs are read-only and need no Origin check).
  if (request.method && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const originErr = sameOriginError(request);
    if (originErr) return { user: null, error: originErr };
  }
  const { user, error } = requireAuth(request);
  if (error) return { user: null, error };
  // Audit M2: the token's role claim is a hint, not the authority.
  // Re-check the live role in the database, so a demoted admin (or a
  // token copied before a role change) loses access immediately, and a
  // deleted account cannot use its old token. When the DB is not
  // configured there is no admin at all in practice (login needs the
  // DB), so the token role stands in preview.
  if (isDbConfigured()) {
    try {
      await connectDB();
      const { default: User } = await import("@/models/User");
      const dbUser = await User.findById(user.id).select("role").lean();
      if (!dbUser || dbUser.role !== "admin") {
        return { user: null, error: jsonError("Admin only.", 403) };
      }
      return { user: { ...user, role: dbUser.role }, error: null };
    } catch (err) {
      // A DB failure is a 503, never a silent pass-through.
      return {
        user: null,
        error: jsonError("Database is temporarily unavailable. Please try again.", 503),
      };
    }
  }
  if (user.role !== "admin") {
    return { user: null, error: jsonError("Admin only.", 403) };
  }
  return { user, error: null };
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    createdAt: user.createdAt || null,
  };
}

// Small JSON helper used by auth guards (kept here to avoid a circular import).
import { NextResponse } from "next/server";
function jsonError(message, status) {
  return NextResponse.json({ error: message }, { status });
}
