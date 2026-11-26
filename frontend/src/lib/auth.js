// Auth helpers — JWT in an httpOnly cookie.
//
// Library choice: `jsonwebtoken` (not `jose`). It is the standard JWT
// library in the MERN stack Zain already knows, it works in the Node.js
// runtime our API routes use, and its API (sign/verify) is one line each.
// `jose` is better for Edge runtimes; we do not use the Edge runtime here.

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

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
    return jwt.verify(token, getSecret());
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

export function requireAdmin(request) {
  const { user, error } = requireAuth(request);
  if (error) return { user: null, error };
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
  };
}

// Small JSON helper used by auth guards (kept here to avoid a circular import).
import { NextResponse } from "next/server";
function jsonError(message, status) {
  return NextResponse.json({ error: message }, { status });
}
