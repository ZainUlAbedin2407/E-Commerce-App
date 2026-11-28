// Seed defaults shared by the seed script and by the public APIs.
//
// When the DB is not configured, the public routes serve these defaults
// (resolved against the local fallback catalogue in src/lib/products.js)
// so the homepage, brands, filters and reviews render in dev without
// Atlas. scripts/seed.mjs inserts the same records into MongoDB.
//
// Sections reference products by SLUG here; the seed script resolves
// them to ObjectIds before insert, and resolveSectionProducts matches
// either form.

import { PRODUCTS, BRANDS } from "./products.js";

export const DEFAULT_BRANDS = BRANDS.map((b) => ({ ...b }));

// Default homepage sections (visible, ordered). Manual sections list
// product slugs; rule sections carry the rule.
export const DEFAULT_SECTIONS = [
  {
    type: "hero",
    title: "OMXMO OX-PD13 50000mAh Power Bank",
    visible: true,
    order: 0,
    sourceType: "manual",
    productIds: ["omxmo-ox-pd13"],
    rule: { kind: "new", category: "", tag: "", windowDays: 30, limit: 8 },
  },
  {
    type: "categoryTiles",
    title: "",
    visible: true,
    order: 1,
    sourceType: "manual",
    productIds: [],
    rule: { kind: "new", category: "", tag: "", windowDays: 30, limit: 8 },
  },
  {
    type: "productRow",
    title: "Best Sellers",
    visible: true,
    order: 2,
    sourceType: "rule",
    productIds: [],
    rule: { kind: "bestSelling", category: "", tag: "", windowDays: 30, limit: 8 },
  },
  {
    type: "productRow",
    title: "New Arrivals",
    visible: true,
    order: 3,
    sourceType: "rule",
    productIds: [],
    rule: { kind: "new", category: "", tag: "", windowDays: 30, limit: 8 },
  },
  {
    type: "productRow",
    title: "Power that lasts the day",
    visible: true,
    order: 4,
    sourceType: "manual",
    productIds: ["omxmo-ox-pd10"],
    rule: { kind: "new", category: "", tag: "", windowDays: 30, limit: 8 },
  },
  {
    type: "brandsStrip",
    title: "",
    visible: true,
    order: 5,
    sourceType: "manual",
    productIds: [],
    rule: { kind: "new", category: "", tag: "", windowDays: 30, limit: 8 },
  },
  {
    type: "reviewsTeaser",
    title: "",
    visible: true,
    order: 6,
    sourceType: "manual",
    productIds: [],
    rule: { kind: "new", category: "", tag: "", windowDays: 30, limit: 8 },
  },
  {
    type: "trustBadges",
    title: "",
    visible: true,
    order: 7,
    sourceType: "manual",
    productIds: [],
    rule: { kind: "new", category: "", tag: "", windowDays: 30, limit: 8 },
  },
];

// Default filter definitions (active, ordered). Values are derived from
// the products themselves at read time.
export const DEFAULT_FILTERS = [
  { key: "brand", label: "Brand", type: "list", source: "brand", active: true, sortOrder: 0 },
  { key: "category", label: "Category", type: "list", source: "category", active: true, sortOrder: 1 },
  { key: "price", label: "Price", type: "range", source: "price", active: true, sortOrder: 2 },
  { key: "availability", label: "In stock", type: "boolean", source: "availability", active: true, sortOrder: 3 },
  { key: "rating", label: "Rating", type: "list", source: "rating", active: true, sortOrder: 4 },
  { key: "capacity", label: "Capacity", type: "list", source: "spec:Capacity", active: true, sortOrder: 5 },
];

// Seed reviews: EMPTY since 28 Nov 2026. The 3 WhatsApp reviews
// (Buds Pro 9, GREAT NICE GTS-2190, DV-1089) were removed together with
// their products on Zain's instruction (samples with estimated info).
// Their exact words are kept in the V3 plan (sec 6) and in MEMORY.md.
// DV-1089's review is re-added when DV-1089 returns with the Speakers
// batch; Buds Pro 9 and GREAT NICE were never in the catalog (one-off
// stock) and do not return, so their reviews do not return either.
// New reviews come from the website review form (verified against a
// Delivered order) or from admin adding WhatsApp reviews by hand.
export const DEFAULT_REVIEWS = [];

// Settings defaults (see src/models/Settings.js). paymentAccounts are
// ALL EMPTY by default; Zain fills them himself in admin settings.
export const DEFAULT_SETTINGS = {
  shopName: "AI Communication",
  tagline: "Smart Gadgets & Gear",
  address: "Shahjahan Electronics Market, Saddar, Karachi",
  whatsappNumber: "0335-5186552",
  socials: {
    instagram: "https://instagram.com/aicommunicationkhi",
    facebook: "https://facebook.com/aicommunicationkhi",
    tiktok: "https://tiktok.com/@aicommunicationkhi",
    whatsappCommunity: "https://chat.whatsapp.com/JEAoXmegXXtBcERB0ARNEb",
  },
  logoUrl: "/logo-ai-dark.png",
  bannerUrl: "/brand-banner.jpg",
  announcement: { text: "", link: "", active: false, startDate: null, endDate: null },
  delivery: {
    karachiFee: 250,
    otherFee: 300,
    freeUpToKg: 1,
    extraKgFee: 70,
    freeShippingThreshold: null,
  },
  codMaxTotal: 2000,
  paymentAccounts: {
    bankName: "",
    accountTitle: "",
    accountNumber: "",
    iban: "",
    jazzcashNumber: "",
    easypaisaNumber: "",
    raastQrUrl: "",
  },
  paymentMethods: [
    { key: "advance", label: "Advance payment (bank / JazzCash / Easypaisa)", enabled: true },
    { key: "cod", label: "Cash on Delivery", enabled: true },
  ],
  reviewRequestDays: 5,
};

// Plain-object view of the seed products, for routes that serve the
// fallback catalogue without touching Mongoose.
export function getSeedProducts() {
  return PRODUCTS.map((p) => ({ ...p, createdAt: null }));
}
