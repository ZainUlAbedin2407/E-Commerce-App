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
    title: "DV-1089 Wireless Speaker",
    visible: true,
    order: 0,
    sourceType: "manual",
    productIds: ["dv-1089"],
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

// The 3 seed reviews, in the customers' EXACT words from the V3 plan
// (sec 6), copied from the plan file, not re-transcribed from the
// screenshots. Customer names are not visible in the screenshots, so
// the name is "Customer"; Zain can edit the name in admin.
// All three: source "whatsapp", verified true, status "approved".
export const DEFAULT_REVIEWS = [
  {
    productSlug: "buds-pro-9",
    name: "Customer",
    rating: 5,
    title: "",
    body: "Bhai earbuds mil gaye hain. Dono check kiye hain, sound quality aur bass price ke hisab se bohat achi hai. Battery timing bhi zabardast chal rahi hai. Bohot shukriya!",
    source: "whatsapp",
    verified: true,
    status: "approved",
  },
  {
    productSlug: "great-nice-gts-2190",
    name: "Customer",
    rating: 5,
    title: "",
    body: "W.Salam Ji Bhai Parcel Shaam me he deliver hogaya tha or Speaker bohot acha nikla, jitna expect kiya tha usse behtar sound or quality hai. Kisi or cheez ki is category me zaroorat hui to aap se hi lenge Insha Allah.",
    source: "whatsapp",
    verified: true,
    status: "approved",
  },
  {
    productSlug: "dv-1089",
    name: "Customer",
    rating: 5,
    title: "",
    body: "Bhai bohot acha speaker hai and sound bhi kafi acha hai iska.",
    source: "whatsapp",
    verified: true,
    status: "approved",
  },
];

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
