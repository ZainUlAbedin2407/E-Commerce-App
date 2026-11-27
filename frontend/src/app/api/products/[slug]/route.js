import { getCatalogProduct, getRelatedProducts, DbUnavailableError } from "@/lib/catalog";
import { json, jsonError, dbErrorResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/products/[slug] — public, plus related products (same category).
export async function GET(_request, { params }) {
  const { slug } = await params;
  try {
    const product = await getCatalogProduct(slug);
    if (!product) return jsonError("Product not found.", 404);
    const related = await getRelatedProducts(product);
    return json({ product, related });
  } catch (err) {
    if (err instanceof DbUnavailableError || err?.code === "db_unavailable") {
      return dbErrorResponse(err);
    }
    throw err;
  }
}
