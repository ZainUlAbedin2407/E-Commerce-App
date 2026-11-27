import { getHomepageSections, DbUnavailableError } from "@/lib/catalog";
import { json, dbErrorResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/homepage-sections — visible sections only, order ascending,
// products resolved server-side with resolveSectionProducts. Without a
// DB, the DEFAULT sections are returned resolved against the local
// fallback catalogue, so the homepage renders in dev without Atlas.
export async function GET() {
  try {
    const sections = await getHomepageSections();
    return json({ sections });
  } catch (err) {
    if (err instanceof DbUnavailableError || err?.code === "db_unavailable") {
      return dbErrorResponse(err);
    }
    throw err;
  }
}
