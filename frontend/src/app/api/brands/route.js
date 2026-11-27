import { getBrandsWithCounts, DbUnavailableError } from "@/lib/catalog";
import { json, dbErrorResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brands — active brands only, with product counts.
// DB path counts from the Brand + Product collections; without a DB the
// seed brands and the local catalogue are used.
export async function GET() {
  try {
    const brands = await getBrandsWithCounts();
    return json({ brands });
  } catch (err) {
    if (err instanceof DbUnavailableError || err?.code === "db_unavailable") {
      return dbErrorResponse(err);
    }
    throw err;
  }
}
