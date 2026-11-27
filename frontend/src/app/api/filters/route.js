import { getFilterDefinitions, DbUnavailableError } from "@/lib/catalog";
import { json, dbErrorResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/filters — active FilterDefinitions in sortOrder. Without a
// DB, the DEFAULT filter definitions are returned.
export async function GET() {
  try {
    const filters = await getFilterDefinitions();
    return json({ filters });
  } catch (err) {
    if (err instanceof DbUnavailableError || err?.code === "db_unavailable") {
      return dbErrorResponse(err);
    }
    throw err;
  }
}
