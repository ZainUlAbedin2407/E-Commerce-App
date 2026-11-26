import { getCatalogCategories } from "@/lib/catalog";
import { json } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/categories — public. MongoDB when configured, seed otherwise.
export async function GET() {
  const categories = await getCatalogCategories();
  return json({ categories });
}
