// Seed the V3 catalogue into MongoDB Atlas: 6 brands, 6 products,
// 3 WhatsApp reviews, default homepage sections, default filter
// definitions and the Settings singleton.
//
// Idempotent: run it as many times as you like.
// - brands/products: matched by slug.
// - reviews: matched by productId + body.
// - sections: matched by type + title.
// - filters: matched by key.
// - settings: singleton upsert, never overwritten once it exists.
// - pricePKR / stock / weightKg are NEVER overwritten once set (they
//   belong to the admin after the first seed); re-running only backfills
//   them where the DB value is still null.
//
//   MONGODB_URI="mongodb+srv://..." node scripts/seed.mjs
//  , or, with a local .env.local file:
//   node --env-file=.env.local scripts/seed.mjs
//
//   node scripts/seed.mjs --dry-run
//  , validates every seed record against the Mongoose models WITHOUT
//     connecting to MongoDB and prints the full payload it would insert.
//     This is how the build is verified without database credentials.
//
// Prices (V3 plan sec 5.3, all editable in admin; Zain replaces them):
// - DV-1089 Rs 1,250: Zain's REAL sale price from his WhatsApp chat
//   ("1250 ka parega", customer bought one). NOT the old 3,300 band.
// - i20 Rs 2,500 (his confirmed price) · OX-PD10 Rs 3,200 · SY-777
//   Rs 1,500 (researched bands, 26 Nov 2026).
// - Buds Pro 9 Rs 2,300: band midpoint of PK online stores, Rs 1,743
//   (Lumelanes) to Rs 2,850 (airpods.pk); also 1,850 pkmall, 1,998
//   AbrishMart, 2,346 Everyco, 2,399 AS Gadgets, 2,533 ASM VEO.
//   Checked 27 Nov 2026. See src/lib/products.js.
// - GREAT NICE GTS-2190 Rs 1,750: no exact listing found for this model.
//   Comparable 4-inch Greatnice party speakers on shoppersstop.pk:
//   GTS-2118 4 inch Rs 1,508, GTS-2349 Rs 1,615, GTS-2571 Rs 1,200,
//   GTS-2009 Rs 2,306, plus a GTS-2309 sold retail at Rs 1,500.
//   Band 1,200-2,306, midpoint ~1,750. Checked 27 Nov 2026.
//
// Weights and warranty are sensible examples only (Zain, 27 Nov 2026:
// "not tight", he replaces them when he adds his real products).
// Warranty 0 = checking warranty only, for all six.
// Specs contain ONLY facts visible on the product / box in the photo.
// The 3 reviews use the plan's exact words (sec 6), copied from the
// plan file, not re-transcribed from the screenshots. Customer names
// are not visible in the screenshots, so the name is "Customer"; Zain
// can edit the name in admin.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { CATEGORIES, PRODUCTS, BRANDS } from "../src/lib/products.js";
import {
  DEFAULT_SECTIONS,
  DEFAULT_FILTERS,
  DEFAULT_REVIEWS,
  DEFAULT_SETTINGS,
} from "../src/lib/seed-defaults.js";

const DRY_RUN = process.argv.includes("--dry-run");

// Models are imported after the env is loaded; they only need mongoose.
const { default: Category } = await import("../src/models/Category.js");
const { default: Product } = await import("../src/models/Product.js");
const { default: Brand } = await import("../src/models/Brand.js");
const { default: Review } = await import("../src/models/Review.js");
const { default: HomepageSection } = await import("../src/models/HomepageSection.js");
const { default: FilterDefinition } = await import("../src/models/FilterDefinition.js");
const { default: Settings } = await import("../src/models/Settings.js");

// --- Build the payloads (same for dry-run and the real run) ---

function buildBrandDocs() {
  return BRANDS.map((b) => ({
    name: b.name,
    slug: b.slug,
    logo: b.logo || "",
    description: b.description || "",
    active: true,
  }));
}

function buildProductDocs(brandIdBySlug) {
  return PRODUCTS.map((p) => ({
    name: p.name,
    slug: p.slug,
    brandId: brandIdBySlug[p.brandSlug] || null,
    brand: p.brand,
    model: p.model,
    category: p.category,
    pricePKR: p.pricePKR ?? null,
    compareAtPricePKR: p.compareAtPricePKR ?? null,
    stock: p.stock ?? null,
    warrantyMonths: p.warrantyMonths ?? 0,
    weightKg: p.weightKg ?? null,
    lowStockThreshold: null,
    seoTitle: "",
    seoDescription: "",
    shortDesc: p.shortDesc || "",
    specs: p.specs || {},
    features: p.features || [],
    images: p.images || [],
    isFeatured: Boolean(p.isFeatured),
    isNew: Boolean(p.isNew),
    active: true,
  }));
}

function buildReviewDocs(productIdBySlug) {
  return DEFAULT_REVIEWS.map((r) => ({
    productId: productIdBySlug[r.productSlug],
    orderNo: "",
    phone: "",
    name: r.name,
    rating: r.rating,
    title: r.title || "",
    body: r.body,
    photos: [],
    source: r.source,
    status: r.status,
    verified: r.verified,
    adminReply: "",
  }));
}

function buildSectionDocs(productIdBySlug) {
  return DEFAULT_SECTIONS.map((s) => ({
    type: s.type,
    title: s.title || "",
    visible: s.visible !== false,
    order: s.order ?? 0,
    sourceType: s.sourceType || "manual",
    productIds: (s.productIds || []).map((slug) => productIdBySlug[slug]).filter(Boolean),
    rule: {
      kind: s.rule?.kind || "new",
      category: s.rule?.category || "",
      tag: s.rule?.tag || "",
      windowDays: s.rule?.windowDays ?? 30,
      limit: s.rule?.limit ?? 8,
    },
  }));
}

function buildFilterDocs() {
  return DEFAULT_FILTERS.map((f) => ({
    key: f.key,
    label: f.label,
    type: f.type,
    source: f.source,
    active: f.active !== false,
    sortOrder: f.sortOrder ?? 0,
  }));
}

function buildSettingsDoc() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

// --- Dry run: validate everything, print the payload, exit ---

if (DRY_RUN) {
  // Placeholder ObjectIds stand in for the ids MongoDB will assign, so
  // the records validate exactly as they will on insert.
  const brandIdBySlug = {};
  for (const b of BRANDS) brandIdBySlug[b.slug] = new mongoose.Types.ObjectId();
  const productIdBySlug = {};
  for (const p of PRODUCTS) productIdBySlug[p.slug] = new mongoose.Types.ObjectId();

  const payload = {
    brands: buildBrandDocs(),
    products: buildProductDocs(brandIdBySlug),
    reviews: buildReviewDocs(productIdBySlug),
    sections: buildSectionDocs(productIdBySlug),
    filters: buildFilterDocs(),
    settings: buildSettingsDoc(),
  };

  const checks = [
    ["Brand", Brand, payload.brands],
    ["Product", Product, payload.products],
    ["Review", Review, payload.reviews],
    ["HomepageSection", HomepageSection, payload.sections],
    ["FilterDefinition", FilterDefinition, payload.filters],
    ["Settings", Settings, [payload.settings]],
  ];
  let failed = 0;
  for (const [label, Model, docs] of checks) {
    for (const doc of docs) {
      try {
        await new Model(doc).validate();
      } catch (err) {
        failed += 1;
        console.error(`INVALID ${label}: ${doc.slug || doc.key || doc.type || doc._id || ""}`);
        console.error(`  ${err.message}`);
      }
    }
  }

  // Show the payload the way an admin would check it: products with
  // prices/weights, reviews with exact bodies, settings with
  // paymentAccounts shown as EMPTY.
  console.log("=== DRY RUN: seed payload (nothing was written) ===");
  console.log(JSON.stringify(payload, null, 2));
  console.log("=== Validation ===");
  console.log(
    `brands: ${payload.brands.length}, products: ${payload.products.length}, ` +
      `reviews: ${payload.reviews.length}, sections: ${payload.sections.length}, ` +
      `filters: ${payload.filters.length}, settings: 1`
  );
  console.log(
    `paymentAccounts in settings payload: ` +
      `${JSON.stringify(payload.settings.paymentAccounts)} (must stay EMPTY)`
  );
  if (failed > 0) {
    console.error(`FAILED: ${failed} record(s) did not validate.`);
    process.exit(1);
  }
  console.log("All seed records validate against the Mongoose models.");
  process.exit(0);
}

// --- Real run: connect and upsert ---

// Tiny .env.local loader (no extra dependency): only fills vars that are
// not already set in the environment.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Put it in .env.local (see .env.example).");
  process.exit(1);
}

await mongoose.connect(uri, { bufferCommands: false, maxPoolSize: 10 });

for (const [i, c] of CATEGORIES.entries()) {
  await Category.updateOne(
    { slug: c.slug },
    { $set: { name: c.name, blurb: c.blurb || "", sortOrder: i, active: true } },
    { upsert: true }
  );
  console.log(`category ok: ${c.slug}`);
}

// Brands first: products link to them by ObjectId.
const brandIdBySlug = {};
for (const b of buildBrandDocs()) {
  const doc = await Brand.findOneAndUpdate(
    { slug: b.slug },
    { $set: b },
    { upsert: true, new: true }
  );
  brandIdBySlug[b.slug] = doc._id;
  console.log(`brand ok: ${b.slug}`);
}

const productIdBySlug = {};
for (const p of buildProductDocs(brandIdBySlug)) {
  const doc = await Product.findOneAndUpdate(
    { slug: p.slug },
    {
      $set: {
        name: p.name,
        brand: p.brand,
        brandId: p.brandId,
        model: p.model,
        category: p.category,
        shortDesc: p.shortDesc,
        specs: p.specs,
        features: p.features,
        images: p.images,
        isFeatured: p.isFeatured,
        isNew: p.isNew,
        active: true,
      },
      $setOnInsert: {
        pricePKR: p.pricePKR,
        compareAtPricePKR: p.compareAtPricePKR ?? null,
        stock: null,
        warrantyMonths: p.warrantyMonths,
        weightKg: p.weightKg,
      },
    },
    { upsert: true, new: true }
  );
  productIdBySlug[p.slug] = doc._id;
  // Backfill the seed price ONLY where the DB price is still null, an
  // admin-set price is never overwritten. Same for the weight.
  if (p.pricePKR != null) {
    const backfilled = await Product.updateOne(
      { slug: p.slug, pricePKR: null },
      { $set: { pricePKR: p.pricePKR } }
    );
    if (backfilled.modifiedCount > 0) {
      console.log(`price set: ${p.slug} -> Rs. ${p.pricePKR}`);
    }
  }
  // Backfill the compare-at (struck-through) price ONLY where the DB value
  // is still null, an admin-set value is never overwritten. This fixes the
  // Batch 1 earbuds, whose compare-at prices were seeded as null.
  if (p.compareAtPricePKR != null) {
    const backfilledCompare = await Product.updateOne(
      { slug: p.slug, compareAtPricePKR: null },
      { $set: { compareAtPricePKR: p.compareAtPricePKR } }
    );
    if (backfilledCompare.modifiedCount > 0) {
      console.log(`compare-at set: ${p.slug} -> Rs. ${p.compareAtPricePKR}`);
    }
  }
  if (p.weightKg != null) {
    await Product.updateOne(
      { slug: p.slug, weightKg: null },
      { $set: { weightKg: p.weightKg } }
    );
  }
  console.log(`product ok: ${p.slug} (seed pricePKR: ${p.pricePKR ?? "null"})`);
}

for (const r of buildReviewDocs(productIdBySlug)) {
  await Review.updateOne(
    { productId: r.productId, body: r.body },
    { $setOnInsert: r },
    { upsert: true }
  );
  console.log(`review ok: ${r.body.slice(0, 40)}...`);
}

for (const s of buildSectionDocs(productIdBySlug)) {
  await HomepageSection.updateOne(
    { type: s.type, title: s.title },
    { $set: s },
    { upsert: true }
  );
  console.log(`section ok: ${s.type} "${s.title}"`);
}

for (const f of buildFilterDocs()) {
  await FilterDefinition.updateOne({ key: f.key }, { $set: f }, { upsert: true });
  console.log(`filter ok: ${f.key}`);
}

// Settings singleton: created once, never overwritten. paymentAccounts
// stay EMPTY until Zain fills them in admin settings.
await Settings.updateOne(
  { _id: "shop" },
  { $setOnInsert: buildSettingsDoc() },
  { upsert: true }
);
console.log("settings ok: singleton (paymentAccounts empty)");

await mongoose.disconnect();
console.log("Seed done. Next: register on the site, then run scripts/make-admin.mjs <email> to make the first admin.");
