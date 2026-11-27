import { json, sameOriginError } from "@/lib/api-helpers";
import { clearAuthCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/logout — clears the httpOnly cookie. Works with no DB.
export async function POST(request) {
  // Audit M3: even a logout must come from our own origin (a cross-site
  // POST could otherwise log the customer out).
  const originErr = sameOriginError(request);
  if (originErr) return originErr;
  const response = json({ ok: true });
  return clearAuthCookie(response);
}
