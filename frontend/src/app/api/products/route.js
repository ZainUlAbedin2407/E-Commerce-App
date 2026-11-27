import { getCatalogProducts, DbUnavailableError } from "@/lib/catalog";
import { json, dbErrorResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/products?category=&brand=&search=&sort=featured|best|newest|price-asc|price-desc|name
//   &priceMin=&priceMax=&spec_<key>=<value>&inStock=1&rating=<n>&page=&limit=
// Public, paginated. Reads MongoDB when configured, otherwise the local
// seed catalogue, so the shop never breaks when the DB is absent.
// ?search= behavior (src/lib/search.js) is unchanged. Each product
// carries its review aggregate (averageRating, reviewCount).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const specFilters = {};
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith("spec_") && value) specFilters[key.slice(5)] = value;
  }
  const priceMin = searchParams.get("priceMin");
  const priceMax = searchParams.get("priceMax");
  const rating = searchParams.get("rating");
  try {
    const result = await getCatalogProducts({
      category: searchParams.get("category") || "",
      brand: searchParams.get("brand") || "",
      search: searchParams.get("search") || "",
      sort: searchParams.get("sort") || "featured",
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 24,
      priceMin: priceMin != null && priceMin !== "" ? Number(priceMin) : null,
      priceMax: priceMax != null && priceMax !== "" ? Number(priceMax) : null,
      specFilters,
      inStock: searchParams.get("inStock") === "1",
      rating: rating != null && rating !== "" ? Number(rating) : null,
    });
    return json(result);
  } catch (err) {
    // Audit M1: a configured DB that cannot be reached is a 503, never
    // silent seed data.
    if (err instanceof DbUnavailableError || err?.code === "db_unavailable") {
      return dbErrorResponse(err);
    }
    throw err;
  }
}
