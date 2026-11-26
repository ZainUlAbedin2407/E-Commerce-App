// AI Communication — local product seed (Phase 1, UI only).
// HERO-ONLY SEED (Zain's choice, 26 Nov 2026): only these 4 hero products.
// Zain will add the rest himself via the admin panel in Phase 2 — the other
// 12 products he sent (URPIN earbuds, OX-PD11/12/13, DV-2106, 219MINI,
// Portable Music, WS01/WS02, Ultra-2 BIG) are NOT seeded here. Their photos
// and details stay only in the inventory notes, not in this file or in
// public/products/.
// Every product below is confirmed by a photo Zain sent. NOTHING is invented:
// - pricePKR is null for every product. The UI must show "WhatsApp for price".
//   Never put a PKR or $ price here until Zain supplies his price list.
// - specs contain ONLY facts visible on the product / box in the photo.
// Phase 2 will move this exact catalogue into MongoDB; the shape is kept
// deliberately close to the planned Mongoose schema (slug, brand, model,
// category, specs, images, isFeatured, isNew).

export const CATEGORIES = [
  { slug: "earbuds", name: "Earbuds", blurb: "Wireless earbuds — original, sealed pack." },
  { slug: "smartwatches", name: "Smartwatches", blurb: "Smartwatches with straps sets." },
  { slug: "power-banks", name: "Power Banks", blurb: "Fast-charging power banks with LCD display." },
  { slug: "speakers", name: "Speakers", blurb: "Wireless speakers — loud, portable, RGB." },
  { slug: "chargers", name: "Fast Chargers", blurb: "Chargers & adapters — stock arriving soon." },
  { slug: "handsfree", name: "Handsfree", blurb: "Handsfree — stock arriving soon." },
];

export function getCategory(slug) {
  if (slug === "all") return { slug: "all", name: "All Products", blurb: "Everything at AI Communication." };
  return CATEGORIES.find((c) => c.slug === slug) || null;
}

export const PRODUCTS = [
  // ---- Hero 1: Power bank ----
  {
    id: "omxmo-ox-pd10",
    slug: "omxmo-ox-pd10",
    name: "OMXMO OX-PD10 Power Bank 10000mAh",
    brand: "OMXMO",
    model: "OX-PD10",
    category: "power-banks",
    pricePKR: null,
    shortDesc: "10000mAh power bank with LCD display and built-in cables.",
    specs: {
      Capacity: "10000mAh",
      "Super charge": "SCP 22.5W",
      "PD charging": "PD 20W",
      Display: "LCD display",
      Cables: "Built-in Lightning + Type-C",
      Colours: "Black / White",
    },
    images: [
      "/products/omxmo-ox-pd10-front.png",
      "/products/omxmo-ox-pd10-box.jpg",
      "/products/omxmo-ox-pd10-black-white.jpg",
      "/products/omxmo-ox-pd10-stand.jpg",
      "/products/omxmo-ox-pd10-white.jpg",
    ],
    isFeatured: true,
    isNew: true,
  },
  // ---- Hero 2: Speaker ----
  {
    id: "dv-1089",
    slug: "dv-1089",
    name: "DV-1089 Wireless Speaker",
    brand: "DV",
    model: "DV-1089",
    category: "speakers",
    pricePKR: null,
    shortDesc: "Wireless speaker with phone-holder slot and solar panel back.",
    specs: {
      "Phone holder": "Top slot for your phone",
      "Solar panel": "Solar panel on back",
      Inputs: "FM radio / USB / TF card",
      Colours: "Black / Blue-grey",
      Strap: "Carry strap",
    },
    images: [
      "/products/dv-1089-box.jpg",
      "/products/dv-1089-front.jpg",
      "/products/dv-1089-solar.jpg",
      "/products/dv-1089-blue.jpg",
    ],
    isFeatured: true,
    isNew: true,
  },
  // ---- Hero 3: Speaker ----
  {
    id: "sy-777",
    slug: "sy-777",
    name: "SY-777 Wireless Speaker",
    brand: "SY",
    model: "SY-777",
    category: "speakers",
    pricePKR: null,
    shortDesc: "Small square wireless speaker with RGB LED ring.",
    specs: { Lights: "RGB LED ring", Colours: "Blue / Lime-green / Orange", Strap: "Carry strap" },
    images: ["/products/sy-777-blue.jpg", "/products/sy-777-colours.jpg"],
    isFeatured: true,
    isNew: true,
  },
  // ---- Hero 4: Smartwatch ----
  {
    id: "i20-ultra-max-suit",
    slug: "i20-ultra-max-suit",
    name: "i20 ULTRA MAX SUIT Smartwatch — 10 in 1 Set",
    brand: "i20",
    model: "i20 ULTRA MAX SUIT BIG 2.3",
    category: "smartwatches",
    pricePKR: null,
    shortDesc: "Watch + earphones together in one box — 10 in 1 set.",
    specs: { Display: "BIG 2.3 Infinite Display", Set: "10 in 1 (watch + earphones)" },
    images: ["/products/i20-ultra-max-suit.png"],
    isFeatured: true,
    isNew: true,
  },
];

export function getProduct(slug) {
  return PRODUCTS.find((p) => p.slug === slug) || null;
}

export function getProductsByCategory(slug) {
  if (!slug || slug === "all") return PRODUCTS;
  return PRODUCTS.filter((p) => p.category === slug);
}

export function getFeaturedProducts() {
  return PRODUCTS.filter((p) => p.isFeatured);
}

export function getNewProducts() {
  return PRODUCTS.filter((p) => p.isNew);
}

export function getBrands() {
  return [...new Set(PRODUCTS.map((p) => p.brand))];
}

// Price display rule: no price is ever invented. pricePKR is null until Zain
// supplies his price list (Phase 2 seed). Callers must use this helper.
export function formatPrice(pricePKR) {
  if (pricePKR === null || pricePKR === undefined) return null;
  return `Rs. ${Number(pricePKR).toLocaleString("en-PK")}`;
}
