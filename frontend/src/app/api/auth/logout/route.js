import { json } from "@/lib/api-helpers";
import { clearAuthCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/logout — clears the httpOnly cookie. Works with no DB.
export async function POST() {
  const response = json({ ok: true });
  return clearAuthCookie(response);
}
