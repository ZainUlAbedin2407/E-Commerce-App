import { getCatalogProducts } from "@/lib/catalog";
import { json } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/products?category=&brand=&search=&sort=featured|newest|nameAsc|nameDesc&page=&limit=
// Public, paginated. Reads MongoDB when configured, otherwise the Phase 1
// seed catalogue — the shop never breaks when the DB is absent.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const result = await getCatalogProducts({
    category: searchParams.get("category") || "",
    brand: searchParams.get("brand") || "",
    search: searchParams.get("search") || "",
    sort: searchParams.get("sort") || "featured",
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 24,
  });
  return json(result);
}
