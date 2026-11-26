// Catalogue access — MongoDB when configured, Phase 1 seed otherwise.
//
// Every shop page and every public API route reads through here, so the
// site behaves identically with and without a database: with Atlas set,
// products come from MongoDB (admin-managed); without it, the 4 hero
// products from src/lib/products.js are served and the build/preview still
// works. No prices are ever invented — pricePKR stays null until Zain or
// an admin sets it.
//
// NOTE: shop pages call these functions directly (server-side) instead of
// fetch()ing our own /api routes — same data, no self-HTTP round-trip, and
// it works at build time when no server is listening yet.

import { connectDB, isDbConfigured } from "./mongodb";
import {
  CATEGORIES as SEED_CATEGORIES,
  PRODUCTS as SEED_PRODUCTS,
  getCategory as getSeedCategory,
  getProduct as getSeedProduct,
} from "./products";

function serializeProduct(doc) {
  const p = doc.toObject ? doc.toObject() : doc;
  const specs = p.specs;
  return {
    id: String(p._id || p.id),
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    model: p.model,
    category: p.category,
    pricePKR: p.pricePKR ?? null,
    compareAtPricePKR: p.compareAtPricePKR ?? null,
    // Seed products have no stock info: null = "unknown, ask on WhatsApp".
    stock: p.stock ?? null,
    shortDesc: p.shortDesc || "",
    specs:
      specs && typeof specs === "object" && !(specs instanceof Map)
        ? specs
        : specs instanceof Map
          ? Object.fromEntries(specs)
          : {},
    features: p.features || [],
    images: p.images || [],
    isFeatured: Boolean(p.isFeatured),
    isNew: Boolean(p.isNew),
    active: p.active !== false,
  };
}

function serializeCategory(doc) {
  const c = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(c._id || c.id || c.slug),
    slug: c.slug,
    name: c.name,
    blurb: c.blurb || "",
    image: c.image || "",
    sortOrder: c.sortOrder ?? 0,
    active: c.active !== false,
  };
}

function seedProductShape(p) {
  return {
    ...p,
    compareAtPricePKR: p.compareAtPricePKR ?? null,
    stock: p.stock ?? null,
    features: p.features || [],
    active: true,
  };
}

export function isCatalogDb() {
  return isDbConfigured();
}

export async function getCatalogCategories() {
  if (isDbConfigured()) {
    try {
      await connectDB();
      const { default: Category } = await import("@/models/Category");
      const docs = await Category.find({ active: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean();
      if (docs.length > 0) return docs.map(serializeCategory);
    } catch (err) {
      console.error("Catalogue DB read failed, using seed:", err.message);
    }
  }
  return SEED_CATEGORIES.map((c) => ({
    ...c,
    id: c.slug,
    image: "",
    sortOrder: 0,
    active: true,
  }));
}

export async function getCatalogCategory(slug) {
  if (slug === "all") {
    return { slug: "all", name: "All Products", blurb: "Everything at AI Communication." };
  }
  const categories = await getCatalogCategories();
  return categories.find((c) => c.slug === slug) || null;
}

export async function getCatalogProducts({
  category = "",
  brand = "",
  search = "",
  sort = "featured",
  page = 1,
  limit = 24,
} = {}) {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 24));

  if (isDbConfigured()) {
    try {
      await connectDB();
      const { default: Product } = await import("@/models/Product");
      const filter = { active: true };
      if (category && category !== "all") filter.category = category;
      if (brand) filter.brand = brand;
      if (search) {
        const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ name: rx }, { brand: rx }, { model: rx }];
      }
      const sortMap = {
        featured: { isFeatured: -1, createdAt: -1 },
        newest: { createdAt: -1 },
        nameAsc: { name: 1 },
        nameDesc: { name: -1 },
        // Prices are mostly unset ("WhatsApp for price") — price sorts are
        // deliberately not offered until the price list exists.
      };
      const total = await Product.countDocuments(filter);
      const docs = await Product.find(filter)
        .sort(sortMap[sort] || sortMap.featured)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();
      return {
        products: docs.map(serializeProduct),
        total,
        page: pageNum,
        pages: Math.max(1, Math.ceil(total / limitNum)),
        source: "db",
      };
    } catch (err) {
      console.error("Catalogue DB read failed, using seed:", err.message);
    }
  }

  // Seed fallback (also the build-time path — no env vars during `next build`).
  let products = SEED_PRODUCTS.map(seedProductShape);
  if (category && category !== "all") {
    products = products.filter((p) => p.category === category);
  }
  if (brand) products = products.filter((p) => p.brand === brand);
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q)
    );
  }
  if (sort === "newest") {
    products = [...products].sort((a, b) => Number(b.isNew) - Number(a.isNew));
  } else if (sort === "nameAsc") {
    products = [...products].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "nameDesc") {
    products = [...products].sort((a, b) => b.name.localeCompare(a.name));
  }
  const total = products.length;
  const start = (pageNum - 1) * limitNum;
  return {
    products: products.slice(start, start + limitNum),
    total,
    page: pageNum,
    pages: Math.max(1, Math.ceil(total / limitNum)),
    source: "seed",
  };
}

export async function getCatalogProduct(slug) {
  if (isDbConfigured()) {
    try {
      await connectDB();
      const { default: Product } = await import("@/models/Product");
      const doc = await Product.findOne({ slug, active: true }).lean();
      if (doc) return serializeProduct(doc);
    } catch (err) {
      console.error("Catalogue DB read failed, using seed:", err.message);
    }
  }
  const seed = getSeedProduct(slug);
  return seed ? seedProductShape(seed) : null;
}

// DB-only lookup used by order creation (needs the raw document for stock).
export async function getDbProductBySlug(slug) {
  if (!isDbConfigured()) return null;
  await connectDB();
  const { default: Product } = await import("@/models/Product");
  return Product.findOne({ slug, active: true });
}

export async function getCategoryTiles() {
  const categories = await getCatalogCategories();
  const { products } = await getCatalogProducts({ limit: 100 });
  return categories.map((c) => {
    const inCategory = products.filter((p) => p.category === c.slug);
    return {
      ...c,
      count: inCategory.length,
      cover: inCategory[0]?.images?.[0] || "",
    };
  });
}

export async function getCatalogBrands() {
  if (isDbConfigured()) {
    try {
      await connectDB();
      const { default: Product } = await import("@/models/Product");
      const brands = await Product.distinct("brand", { active: true });
      if (brands.length > 0) return brands.sort();
    } catch (err) {
      console.error("Catalogue DB read failed, using seed:", err.message);
    }
  }
  return [...new Set(SEED_PRODUCTS.map((p) => p.brand))].sort();
}

export async function getRelatedProducts(product, limit = 4) {
  const { products } = await getCatalogProducts({
    category: product.category,
    limit: limit + 1,
  });
  return products.filter((p) => p.slug !== product.slug).slice(0, limit);
}

export { getSeedCategory };
