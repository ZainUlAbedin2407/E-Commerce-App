// Catalogue access — MongoDB when configured, Phase 1 seed otherwise.
//
// ONE RULE (audit M1, Phase 2): when the DB is configured, the DB is the
// source of truth everywhere. A DB error throws DbUnavailableError —
// callers turn it into a 503, never into silent seed data. The seed is
// used ONLY when the DB is not configured (build/preview). The old silent
// fallback is what let the shop display seed products during an outage
// while checkout failed with an uncaught 500.
//
// No prices are ever invented — pricePKR stays null until Zain or
// an admin sets it.
//
// NOTE: shop pages call these functions directly (server-side) instead of
// fetch()ing our own /api routes — same data, no self-HTTP round-trip, and
// it works at build time when no server is listening yet.

import { connectDB, isDbConfigured } from "./mongodb";
import { productMatchesSearch } from "./search";
import {
  CATEGORIES as SEED_CATEGORIES,
  PRODUCTS as SEED_PRODUCTS,
  getCategory as getSeedCategory,
  getProduct as getSeedProduct,
} from "./products";

// Thrown by every catalogue read when the DB is configured but cannot
// be reached. Pages and API routes catch this specifically and show a
// "temporarily unavailable" state with code `db_unavailable`.
export class DbUnavailableError extends Error {
  constructor(message) {
    super(message || "Database is temporarily unavailable.");
    this.name = "DbUnavailableError";
    this.code = "db_unavailable";
  }
}

function serializeProduct(doc) {
  const p = doc.toObject ? doc.toObject() : doc;
  const specs = p.specs;
  return {
    id: String(p._id || p.id),
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    brandId: p.brandId ? String(p.brandId) : null,
    brandSlug: p.brandSlug || "",
    model: p.model,
    category: p.category,
    pricePKR: p.pricePKR ?? null,
    compareAtPricePKR: p.compareAtPricePKR ?? null,
    // Seed products have no stock info: null = stock not tracked.
    stock: p.stock ?? null,
    lowStockThreshold: p.lowStockThreshold ?? null,
    seoTitle: p.seoTitle || "",
    seoDescription: p.seoDescription || "",
    // 0 = checking warranty only; 3/6 = warranty item (PDP badge).
    warrantyMonths: p.warrantyMonths ?? 0,
    // null = weight unknown; the +Rs 70/kg rule uses the base fee until the admin sets the weight.
    weightKg: p.weightKg ?? null,
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
    // Collection fields (V3): a manual collection uses the ordered
    // products list; a rule collection resolves from `rule` at read
    // time. Missing fields mean the plain taxonomy category, which
    // falls back to the category slug filter.
    type: c.type || "manual",
    products: Array.isArray(c.products) ? c.products.map(String) : [],
    rule: {
      kind: c.rule?.kind || "category",
      brand: c.rule?.brand || "",
      tag: c.rule?.tag || "",
      windowDays: c.rule?.windowDays ?? 30,
      limit: c.rule?.limit ?? 24,
    },
  };
}

function seedProductShape(p) {
  return {
    ...p,
    compareAtPricePKR: p.compareAtPricePKR ?? null,
    stock: p.stock ?? null,
    lowStockThreshold: p.lowStockThreshold ?? null,
    seoTitle: p.seoTitle || "",
    seoDescription: p.seoDescription || "",
    features: p.features || [],
    active: true,
  };
}

// --- Review aggregates (approved reviews only) ---
// Returns a Map keyed by product slug: {average, count, byRating}.
// DB path reads the Review collection; seed path uses DEFAULT_REVIEWS.
export async function getReviewAggregates() {
  if (isDbConfigured()) {
    try {
      await connectDB();
      const { default: Review } = await import("@/models/Review");
      const { default: Product } = await import("@/models/Product");
      const rows = await Review.aggregate([
        { $match: { status: "approved" } },
        {
          $group: {
            _id: "$productId",
            count: { $sum: 1 },
            total: { $sum: "$rating" },
            r1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
            r2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
            r3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
            r4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
            r5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          },
        },
      ]);
      const products = await Product.find({}).select("_id slug").lean();
      const slugById = new Map(products.map((p) => [String(p._id), p.slug]));
      const out = new Map();
      for (const r of rows) {
        const slug = slugById.get(String(r._id));
        if (!slug) continue;
        out.set(slug, {
          average: r.count ? Math.round((r.total / r.count) * 10) / 10 : 0,
          count: r.count,
          byRating: { 1: r.r1, 2: r.r2, 3: r.r3, 4: r.r4, 5: r.r5 },
        });
      }
      return out;
    } catch (err) {
      throw new DbUnavailableError(err.message);
    }
  }
  const { DEFAULT_REVIEWS } = await import("./seed-defaults");
  const out = new Map();
  for (const r of DEFAULT_REVIEWS) {
    if (r.status !== "approved") continue;
    const agg = out.get(r.productSlug) || {
      average: 0,
      count: 0,
      byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
    agg.count += 1;
    agg.byRating[r.rating] = (agg.byRating[r.rating] || 0) + 1;
    agg.average = Math.round(((agg.average * (agg.count - 1) + r.rating) / agg.count) * 10) / 10;
    out.set(r.productSlug, agg);
  }
  return out;
}

function attachAggregates(products, aggregates) {
  return products.map((p) => {
    const agg = aggregates.get(p.slug);
    return {
      ...p,
      averageRating: agg?.average ?? 0,
      reviewCount: agg?.count ?? 0,
    };
  });
}

export async function getCatalogCategories() {
  if (isDbConfigured()) {
    try {
      await connectDB();
      const { default: Category } = await import("@/models/Category");
      const docs = await Category.find({ active: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean();
      // The DB is the source of truth when configured — an empty result
      // means empty, never "fall back to seed".
      return docs.map(serializeCategory);
    } catch (err) {
      throw new DbUnavailableError(err.message);
    }
  }
  return SEED_CATEGORIES.map((c) => ({
    ...c,
    id: c.slug,
    image: "",
    sortOrder: 0,
    active: true,
    type: "manual",
    products: [],
    rule: { kind: "category", brand: "", tag: "", windowDays: 30, limit: 24 },
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
  priceMin = null,
  priceMax = null,
  specFilters = {},
  inStock = false,
  rating = null,
  collection = null,
} = {}) {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 24));
  const aggregates = await getReviewAggregates();

  if (isDbConfigured()) {
    try {
      await connectDB();
      const { default: Product } = await import("@/models/Product");
      const filter = { active: true };
      // A collection decides the base set when one is passed: a manual
      // collection with a picked list uses those products in order; a
      // rule collection resolves from its rule (kind "category" means
      // this collection's own slug; kind "brand" uses rule.brand, a
      // brand slug). A manual collection with an empty list, and the
      // plain taxonomy categories, fall back to the category slug.
      const rule = collection?.type === "rule" ? collection.rule || {} : null;
      const manualIds =
        collection?.type === "manual" &&
        Array.isArray(collection.products) &&
        collection.products.length > 0
          ? collection.products.map(String)
          : null;
      if (manualIds) {
        filter._id = { $in: manualIds };
      } else if (rule) {
        if (rule.kind === "category") filter.category = collection.slug;
        if (rule.kind === "onSale") {
          filter.$expr = { $gt: ["$compareAtPricePKR", "$pricePKR"] };
        }
        if (rule.kind === "new") {
          const since = new Date(
            Date.now() - (Number(rule.windowDays) || 30) * 24 * 60 * 60 * 1000
          );
          filter.$and = filter.$and || [];
          filter.$and.push({ $or: [{ isNew: true }, { createdAt: { $gte: since } }] });
        }
      } else if (category && category !== "all") {
        filter.category = category;
      }
      // Brand slug resolves via the Brand model; match brandId OR the
      // legacy brand string, so old products keep working. A rule
      // collection of kind "brand" supplies the brand slug.
      const effectiveBrand = brand || (rule?.kind === "brand" ? rule.brand || "" : "");
      if (effectiveBrand) {
        const { default: Brand } = await import("@/models/Brand");
        const brandDoc = await Brand.findOne({ slug: effectiveBrand.toLowerCase() }).lean();
        const brandName = brandDoc?.name || effectiveBrand;
        const safeName = brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            ...(brandDoc ? [{ brandId: brandDoc._id }] : []),
            { brand: new RegExp(`^${safeName}$`, "i") },
          ],
        });
      }
      if (priceMin != null || priceMax != null) {
        filter.pricePKR = {};
        if (priceMin != null) filter.pricePKR.$gte = Number(priceMin);
        if (priceMax != null) filter.pricePKR.$lte = Number(priceMax);
      }
      // ?spec_<key>=<value> matches specs[key] case-insensitively.
      for (const [key, value] of Object.entries(specFilters || {})) {
        if (value == null || value === "") continue;
        const safeValue = String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter[`specs.${key}`] = { $regex: new RegExp(safeValue, "i") };
      }
      if (inStock) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: [{ stock: null }, { stock: { $gt: 0 } }] });
      }
      const sortMap = {
        featured: { isFeatured: -1, createdAt: -1 },
        newest: { createdAt: -1 },
        name: { name: 1 },
        nameAsc: { name: 1 },
        nameDesc: { name: -1 },
        "price-asc": { pricePKR: 1, createdAt: -1 },
        "price-desc": { pricePKR: -1, createdAt: -1 },
        // "best" is ranked in JS below (units sold from Order items).
        best: { isFeatured: -1, createdAt: -1 },
      };
      // Search is matched in JS (audit M4): normalization, synonyms,
      // dash-tolerance ("dv1089" → "DV-1089") and typo tolerance live
      // in src/lib/search.js. The catalogue is small; this moves to
      // Atlas Search when it grows past a few hundred products.
      const candidates = await Product.find(filter)
        .sort(sortMap[sort] || sortMap.featured)
        .limit(200)
        .lean();
      let matched = candidates.map(serializeProduct);
      // Rule kind "tag": the tag must appear in a spec value, a
      // feature, the name, or the model (case-insensitive).
      if (rule?.kind === "tag" && rule.tag) {
        const needle = String(rule.tag).toLowerCase();
        matched = matched.filter((p) => {
          const hay = [
            p.name,
            p.model,
            ...(p.features || []),
            ...Object.values(p.specs || {}),
          ]
            .map((v) => String(v ?? "").toLowerCase())
            .join(" ");
          return hay.includes(needle);
        });
      }
      if (search) matched = matched.filter((p) => productMatchesSearch(p, search));
      if (rating != null) {
        const min = Number(rating);
        matched = matched.filter((p) => (aggregates.get(p.slug)?.average ?? 0) >= min);
      }
      if (sort === "best") {
        const { default: Order } = await import("@/models/Order");
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const soldRows = await Order.aggregate([
          { $match: { status: { $ne: "Cancelled" }, createdAt: { $gte: since } } },
          { $unwind: "$items" },
          { $group: { _id: "$items.slug", units: { $sum: "$items.qty" } } },
        ]);
        const units = new Map(soldRows.map((r) => [r._id, r.units]));
        matched = [...matched].sort(
          (a, b) => (units.get(b.slug) || 0) - (units.get(a.slug) || 0)
        );
      }
      // Name sorts are case-insensitive (localeCompare). MongoDB sorts
      // "i20" after "SY-777" (lowercase sorts after uppercase), which
      // reads as a broken sort. This matches the seed path below.
      if (sort === "name" || sort === "nameAsc") {
        matched = [...matched].sort((a, b) => a.name.localeCompare(b.name));
      } else if (sort === "nameDesc") {
        matched = [...matched].sort((a, b) => b.name.localeCompare(a.name));
      }
      // A manual collection keeps its picked order under the default sort.
      if (manualIds && (!sort || sort === "featured")) {
        const rank = new Map(manualIds.map((id, i) => [id, i]));
        matched = [...matched].sort(
          (a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999)
        );
      }
      // A rule limit caps how many products the collection shows.
      if (rule?.limit) matched = matched.slice(0, Number(rule.limit) || 24);
      matched = attachAggregates(matched, aggregates);
      const total = matched.length;
      const start = (pageNum - 1) * limitNum;
      return {
        products: matched.slice(start, start + limitNum),
        total,
        page: pageNum,
        pages: Math.max(1, Math.ceil(total / limitNum)),
        source: "db",
      };
    } catch (err) {
      throw new DbUnavailableError(err.message);
    }
  }

  // Seed path — only when the DB is NOT configured (build/preview).
  let products = SEED_PRODUCTS.map(seedProductShape);
  const seedRule = collection?.type === "rule" ? collection.rule || {} : null;
  const seedManualIds =
    collection?.type === "manual" &&
    Array.isArray(collection.products) &&
    collection.products.length > 0
      ? collection.products.map(String)
      : null;
  if (seedManualIds) {
    const rank = new Map(seedManualIds.map((id, i) => [id, i]));
    const rankOf = (p) => rank.get(String(p.id)) ?? rank.get(p.slug) ?? 999;
    products = products
      .filter((p) => rankOf(p) < 999)
      .sort((a, b) => rankOf(a) - rankOf(b));
  } else if (seedRule?.kind === "brand" && seedRule.brand) {
    const needle = String(seedRule.brand).toLowerCase();
    products = products.filter(
      (p) => (p.brandSlug || "").toLowerCase() === needle || p.brand.toLowerCase() === needle
    );
  } else if (seedRule?.kind === "onSale") {
    products = products.filter(
      (p) => p.compareAtPricePKR != null && p.pricePKR != null && p.compareAtPricePKR > p.pricePKR
    );
  } else if (seedRule?.kind === "new") {
    products = products.filter((p) => p.isNew);
  } else if (seedRule?.kind === "tag" && seedRule.tag) {
    const needle = String(seedRule.tag).toLowerCase();
    products = products.filter((p) => {
      const hay = [p.name, p.model, ...(p.features || []), ...Object.values(p.specs || {})]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ");
      return hay.includes(needle);
    });
  } else if (category && category !== "all") {
    products = products.filter((p) => p.category === category);
  }
  if (brand) {
    const needle = brand.toLowerCase();
    products = products.filter(
      (p) => (p.brandSlug || "").toLowerCase() === needle || p.brand.toLowerCase() === needle
    );
  }
  if (priceMin != null) products = products.filter((p) => p.pricePKR != null && p.pricePKR >= Number(priceMin));
  if (priceMax != null) products = products.filter((p) => p.pricePKR != null && p.pricePKR <= Number(priceMax));
  for (const [key, value] of Object.entries(specFilters || {})) {
    if (value == null || value === "") continue;
    const needle = String(value).toLowerCase();
    products = products.filter((p) =>
      String(p.specs?.[key] ?? "").toLowerCase().includes(needle)
    );
  }
  if (inStock) products = products.filter((p) => p.stock == null || p.stock > 0);
  if (search) {
    products = products.filter((p) => productMatchesSearch(p, search));
  }
  if (rating != null) {
    const min = Number(rating);
    products = products.filter((p) => (aggregates.get(p.slug)?.average ?? 0) >= min);
  }
  if (sort === "newest") {
    products = [...products].sort((a, b) => Number(b.isNew) - Number(a.isNew));
  } else if (sort === "nameAsc" || sort === "name") {
    products = [...products].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "nameDesc") {
    products = [...products].sort((a, b) => b.name.localeCompare(a.name));
  } else if (sort === "price-asc") {
    products = [...products].sort((a, b) => (a.pricePKR ?? Infinity) - (b.pricePKR ?? Infinity));
  } else if (sort === "price-desc") {
    products = [...products].sort((a, b) => (b.pricePKR ?? -Infinity) - (a.pricePKR ?? -Infinity));
  }
  // A rule limit caps how many products the collection shows.
  if (seedRule?.limit) products = products.slice(0, Number(seedRule.limit) || 24);
  products = attachAggregates(products, aggregates);
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
      // Configured DB, missing doc = the product does not exist (null).
      // The old seed fallback here is what made the featured product show
      // while the lists were empty (audit C1).
      if (!doc) return null;
      const aggregates = await getReviewAggregates();
      const agg = aggregates.get(slug);
      return {
        ...serializeProduct(doc),
        averageRating: agg?.average ?? 0,
        reviewCount: agg?.count ?? 0,
      };
    } catch (err) {
      throw new DbUnavailableError(err.message);
    }
  }
  const seed = getSeedProduct(slug);
  if (!seed) return null;
  const aggregates = await getReviewAggregates();
  const agg = aggregates.get(slug);
  return {
    ...seedProductShape(seed),
    averageRating: agg?.average ?? 0,
    reviewCount: agg?.count ?? 0,
  };
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
      return brands.sort();
    } catch (err) {
      throw new DbUnavailableError(err.message);
    }
  }
  return [...new Set(SEED_PRODUCTS.map((p) => p.brand))].sort();
}

// --- V3 helpers: settings, homepage sections, filters, reviews, brands ---

function plainSettings(doc) {
  const s = doc.toObject ? doc.toObject() : doc;
  return {
    shopName: s.shopName,
    tagline: s.tagline,
    address: s.address,
    whatsappNumber: s.whatsappNumber,
    socials: s.socials || {},
    logoUrl: s.logoUrl,
    bannerUrl: s.bannerUrl,
    announcement: s.announcement || { text: "", link: "", active: false },
    delivery: s.delivery || {},
    codMaxTotal: s.codMaxTotal ?? 2000,
    paymentAccounts: s.paymentAccounts || {},
    paymentMethods: s.paymentMethods || [],
    reviewRequestDays: s.reviewRequestDays ?? 5,
  };
}

// Full settings (admin use only). When the DB is not configured, the
// defaults are returned so admin screens can still render.
export async function getSettings() {
  const { DEFAULT_SETTINGS } = await import("./seed-defaults");
  if (!isDbConfigured()) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  try {
    await connectDB();
    const { default: Settings } = await import("@/models/Settings");
    const doc = await Settings.findById("shop").lean();
    if (!doc) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    return plainSettings(doc);
  } catch (err) {
    throw new DbUnavailableError(err.message);
  }
}

// Public settings: everything the storefront needs, NEVER paymentAccounts.
export async function getPublicSettings() {
  const s = await getSettings();
  const { paymentAccounts, ...pub } = s;
  return pub;
}

function serializeSection(section) {
  const s = section.toObject ? section.toObject() : section;
  return {
    _id: String(s._id || `${s.type}-${s.order}`),
    type: s.type,
    title: s.title || "",
    visible: s.visible !== false,
    order: s.order ?? 0,
    sourceType: s.sourceType || "manual",
    productIds: (s.productIds || []).map((id) => String(id)),
    rule: s.rule || {},
  };
}

// Recent non-cancelled orders, for the bestSelling section rule.
export async function getRecentOrders(limit = 100) {
  if (!isDbConfigured()) return [];
  try {
    await connectDB();
    const { default: Order } = await import("@/models/Order");
    return Order.find({ status: { $ne: "Cancelled" } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("items createdAt")
      .lean();
  } catch (err) {
    throw new DbUnavailableError(err.message);
  }
}

// Visible homepage sections, order ascending, products resolved
// server-side. DB path reads HomepageSection; seed path uses the
// defaults resolved against the local catalogue.
export async function getHomepageSections() {
  const { resolveSectionProducts } = await import("./sections");
  const { products } = await getCatalogProducts({ limit: 100 });
  const orders = await getRecentOrders();
  if (isDbConfigured()) {
    try {
      await connectDB();
      const { default: HomepageSection } = await import("@/models/HomepageSection");
      const total = await HomepageSection.countDocuments();
      if (total === 0) {
        // Collection never seeded (live DB still on V2 data): fall through to
        // DEFAULT_SECTIONS below so the homepage renders instead of empty.
        // An admin who hid every section has total > 0, so their choice stands.
      } else {
        const docs = await HomepageSection.find({ visible: true }).sort({ order: 1 }).lean();
        return docs.map((doc) => ({
          ...serializeSection(doc),
          products: resolveSectionProducts(doc, products, orders),
        }));
      }
    } catch (err) {
      throw new DbUnavailableError(err.message);
    }
  }
  const { DEFAULT_SECTIONS } = await import("./seed-defaults");
  return DEFAULT_SECTIONS.filter((s) => s.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((s) => ({
      ...serializeSection(s),
      products: resolveSectionProducts(s, products, orders),
    }));
}

// Active filter definitions, sortOrder ascending.
export async function getFilterDefinitions() {
  if (isDbConfigured()) {
    try {
      await connectDB();
      const { default: FilterDefinition } = await import("@/models/FilterDefinition");
      const docs = await FilterDefinition.find({ active: true }).sort({ sortOrder: 1 }).lean();
      return docs.map((d) => ({
        id: String(d._id),
        key: d.key,
        label: d.label,
        type: d.type,
        source: d.source,
        sortOrder: d.sortOrder ?? 0,
      }));
    } catch (err) {
      throw new DbUnavailableError(err.message);
    }
  }
  const { DEFAULT_FILTERS } = await import("./seed-defaults");
  return DEFAULT_FILTERS.filter((f) => f.active).sort((a, b) => a.sortOrder - b.sortOrder);
}

function serializeReview(r, productSlug) {
  const x = r.toObject ? r.toObject() : r;
  return {
    id: String(x._id || `${x.productSlug || productSlug}-${x.createdAt || ""}`),
    productSlug: productSlug || x.productSlug || "",
    name: x.name,
    rating: x.rating,
    title: x.title || "",
    body: x.body,
    source: x.source,
    status: x.status,
    verified: Boolean(x.verified),
    adminReply: x.adminReply || "",
    createdAt: x.createdAt || null,
  };
}

// Approved reviews (newest first) plus the aggregate. productSlug is
// optional: without it, all approved reviews across products are
// returned (the /reviews page). Never exposes phone or orderNo.
export async function getApprovedReviews({ productSlug = "", rating = null, source = "" } = {}) {
  const emptyAgg = { average: 0, count: 0, byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  if (isDbConfigured()) {
    try {
      await connectDB();
      const { default: Review } = await import("@/models/Review");
      const { default: Product } = await import("@/models/Product");
      let productId = null;
      let slug = productSlug;
      if (productSlug) {
        const product = await Product.findOne({ slug: productSlug }).select("_id slug").lean();
        if (!product) return { reviews: [], aggregate: emptyAgg };
        productId = product._id;
        slug = product.slug;
      }
      const filter = { status: "approved" };
      if (productId) filter.productId = productId;
      if (source) filter.source = source;
      if (rating != null) filter.rating = Number(rating);
      const docs = await Review.find(filter).sort({ createdAt: -1 }).lean();
      const aggregate = { ...emptyAgg, byRating: { ...emptyAgg.byRating } };
      // Aggregate is computed over ALL approved reviews of the product
      // (before the rating/source filters), so the stars never lie.
      const allFilter = { status: "approved" };
      if (productId) allFilter.productId = productId;
      const all = await Review.find(allFilter).select("rating").lean();
      for (const r of all) {
        aggregate.count += 1;
        aggregate.byRating[r.rating] = (aggregate.byRating[r.rating] || 0) + 1;
      }
      if (aggregate.count) {
        aggregate.average =
          Math.round((all.reduce((s, r) => s + r.rating, 0) / aggregate.count) * 10) / 10;
      }
      // When no product filter is given, the aggregate is across all.
      return {
        reviews: docs.map((d) => serializeReview(d, slug || "")),
        aggregate,
      };
    } catch (err) {
      throw new DbUnavailableError(err.message);
    }
  }
  const { DEFAULT_REVIEWS } = await import("./seed-defaults");
  let list = DEFAULT_REVIEWS.filter((r) => r.status === "approved");
  if (productSlug) list = list.filter((r) => r.productSlug === productSlug);
  const aggregate = { ...emptyAgg, byRating: { ...emptyAgg.byRating } };
  for (const r of list) {
    aggregate.count += 1;
    aggregate.byRating[r.rating] = (aggregate.byRating[r.rating] || 0) + 1;
  }
  if (aggregate.count) {
    aggregate.average =
      Math.round((list.reduce((s, r) => s + r.rating, 0) / aggregate.count) * 10) / 10;
  }
  if (source) list = list.filter((r) => r.source === source);
  if (rating != null) list = list.filter((r) => r.rating === Number(rating));
  return { reviews: list.map((r) => serializeReview(r, r.productSlug)), aggregate };
}

// Brands with product counts, for /brands. DB path reads the Brand
// model; seed path uses BRANDS plus the local catalogue.
export async function getBrandsWithCounts() {
  if (isDbConfigured()) {
    try {
      await connectDB();
      const { default: Brand } = await import("@/models/Brand");
      const { default: Product } = await import("@/models/Product");
      const brands = await Brand.find({ active: true }).sort({ name: 1 }).lean();
      const counts = await Product.aggregate([
        { $match: { active: true, brandId: { $ne: null } } },
        { $group: { _id: "$brandId", count: { $sum: 1 } } },
      ]);
      const countById = new Map(counts.map((c) => [String(c._id), c.count]));
      // Legacy products without brandId still count via the brand string.
      const legacyCounts = await Product.aggregate([
        { $match: { active: true, brandId: null } },
        { $group: { _id: "$brand", count: { $sum: 1 } } },
      ]);
      const legacyByName = new Map(legacyCounts.map((c) => [c._id, c.count]));
      return brands.map((b) => ({
        id: String(b._id),
        slug: b.slug,
        name: b.name,
        logo: b.logo || "",
        description: b.description || "",
        productCount: (countById.get(String(b._id)) || 0) + (legacyByName.get(b.name) || 0),
      }));
    } catch (err) {
      throw new DbUnavailableError(err.message);
    }
  }
  const { BRANDS } = await import("./products");
  return BRANDS.map((b) => ({
    id: b.slug,
    slug: b.slug,
    name: b.name,
    logo: b.logo || "",
    description: b.description || "",
    productCount: SEED_PRODUCTS.filter(
      (p) => p.brandSlug === b.slug || p.brand === b.name
    ).length,
  }));
}

export { getSeedCategory };

export async function getRelatedProducts(product, limit = 4) {
  const { products } = await getCatalogProducts({
    category: product.category,
    limit: limit + 1,
  });
  return products.filter((p) => p.slug !== product.slug).slice(0, limit);
}
