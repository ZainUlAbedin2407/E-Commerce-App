import { getCatalogProducts, DbUnavailableError } from "@/lib/catalog";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import { json, jsonError, dbErrorResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brands/[slug] — {brand, products}. Products are serialized
// exactly like /api/products. Without a DB, the seed brand and the local
// catalogue are used.
export async function GET(_request, { params }) {
  const { slug } = await params;
  const needle = String(slug || "").toLowerCase();
  try {
    if (isDbConfigured()) {
      await connectDB();
      const { default: Brand } = await import("@/models/Brand");
      const brand = await Brand.findOne({ slug: needle, active: true }).lean();
      if (!brand) return jsonError("Brand not found.", 404);
      const { products } = await getCatalogProducts({ brand: needle, limit: 100 });
      return json({
        brand: {
          id: String(brand._id),
          slug: brand.slug,
          name: brand.name,
          logo: brand.logo || "",
          description: brand.description || "",
        },
        products,
      });
    }
    const { BRANDS } = await import("@/lib/products");
    const brand = BRANDS.find((b) => b.slug === needle);
    if (!brand) return jsonError("Brand not found.", 404);
    const { products } = await getCatalogProducts({ brand: needle, limit: 100 });
    return json({ brand: { id: brand.slug, ...brand }, products });
  } catch (err) {
    if (err instanceof DbUnavailableError || err?.code === "db_unavailable") {
      return dbErrorResponse(err);
    }
    throw err;
  }
}
