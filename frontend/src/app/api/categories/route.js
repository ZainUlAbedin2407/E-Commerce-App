import { getCategoryTiles, DbUnavailableError } from "@/lib/catalog";
import { json, dbErrorResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/categories — public. MongoDB when configured, seed otherwise.
// Returns category tiles (name, blurb, cover photo, product count) for
// the header mega menu and the category grid.
export async function GET() {
  try {
    const categories = await getCategoryTiles();
    return json({ categories });
  } catch (err) {
    if (err instanceof DbUnavailableError || err?.code === "db_unavailable") {
      return dbErrorResponse(err);
    }
    throw err;
  }
}
