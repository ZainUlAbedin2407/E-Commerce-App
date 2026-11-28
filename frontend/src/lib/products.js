// AI Communication, local product seed (V3, 27 Nov 2026; Batch 1, 28 Nov 2026).
//
// TWENTY-ONE products: the 4 heroes plus Buds Pro 9 and the GREAT NICE
// speaker (from Zain's WhatsApp review screenshots, 27 Nov), plus 7 earbuds
// from Zain's WhatsApp catalog screenshots (Batch 1, 28 Nov): Urpin UA-30
// Pro, Urpin UA-50 Pro, Urpin UA-60 Pro, Buds Pro 2, Buds Pro 3, Buds
// Pro 4, Buds Pro 5, plus 9 power banks from the catalog (Batch 2, 28 Nov):
// OMXMO OX-PD01, OX-PD02, OX-PD03, OX-PD10 (replaces the old seed entry),
// OX-PD11, OX-PD12, OX-PD13, OX-PD15, OX-PD16. URPIN PD18 10000mAh
// (Rs 2,500, was 3,000) is in the catalog list but its folder/images were
// NOT in the Batch 2 RAR, so it is not seeded yet.
// This file is the local fallback catalogue AND the seed source -
// scripts/seed.mjs inserts these exact records into MongoDB, so the two
// must stay in sync.
//
// PRICES (all editable in admin; Zain replaces them with his own):
// - DV-1089 Rs 1,250: Zain's REAL sale price from his WhatsApp chat
//   ("1250 ka parega", customer bought one). It replaces the old
//   researched band of Rs 3,000-3,500, which was wrong for this product.
// - i20 Rs 2,500 (his confirmed price), OX-PD10 Rs 3,200, SY-777 Rs 1,500:
//   researched bands from 26 Nov 2026, unchanged.
// - Buds Pro 9 Rs 2,300: band midpoint. PK online stores list it at
//   Rs 1,743 (Lumelanes), 1,850 (pkmall), 1,998 (AbrishMart), 2,346
//   (Everyco), 2,399 (AS Gadgets), 2,533 (ASM VEO), 2,850 (airpods.pk)
//  , band 1,743-2,850, midpoint ~2,300. Checked 27 Nov 2026.
// - GREAT NICE GTS-2190 Rs 1,750: no exact listing found for this model.
//   Comparable 4-inch Greatnice party speakers on shoppersstop.pk:
//   GTS-2118 4 inch Rs 1,508, GTS-2349 Rs 1,615, GTS-2571 Rs 1,200,
//   GTS-2009 Rs 2,306, plus a GTS-2309 sold retail at Rs 1,500 -
//   band 1,200-2,306, midpoint ~1,750. Checked 27 Nov 2026.
// - Batch 1 earbuds (28 Nov 2026): Zain's WhatsApp catalog prices, sale
//   price first, struck-through compare-at second:
//   UA-30 Pro Rs 2,150 (was 2,400), UA-50 Pro Rs 2,250 (was 2,500),
//   UA-60 Pro Rs 2,350 (was 2,600), Buds Pro 2 Rs 1,000 (was 1,300),
//   Buds Pro 3 Rs 1,100 (was 1,400), Buds Pro 4 Rs 1,200 (was 1,500),
//   Buds Pro 5 Rs 1,300 (was 1,600). Buds Pro 3 / 4 images are the
//   product renders from Zain's catalog folder (Gemini-generated files);
//   Zain confirmed 28 Nov 2026 these ARE the actual product images, so
//   they are used.
//
// WEIGHTS and WARRANTY are sensible examples only (Zain, 27 Nov 2026:
// "not tight", he replaces them when he adds his real products).
// Warranty 0 = checking warranty only, for all eleven.
// Specs contain ONLY facts visible on the product / box in the photo or
// transcribed from Zain's WhatsApp catalog detail screenshots (Batch 1).
// URPIN products ARE seeded now (Batch 1, 28 Nov 2026).

export const CATEGORIES = [
  { slug: "earbuds", name: "Earbuds", blurb: "Wireless earbuds, original, sealed pack." },
  { slug: "smartwatches", name: "Smartwatches", blurb: "Smartwatches with straps sets." },
  { slug: "power-banks", name: "Power Banks", blurb: "Fast-charging power banks with LCD display." },
  { slug: "speakers", name: "Speakers", blurb: "Wireless speakers, loud, portable, RGB." },
  { slug: "chargers", name: "Fast Chargers", blurb: "Chargers & adapters, stock arriving soon." },
  { slug: "handsfree", name: "Handsfree", blurb: "Handsfree, stock arriving soon." },
];

// Brands seeded alongside the products (scripts/seed.mjs). `brandId` is
// the Mongo ObjectId once seeded; in this local file it is null and the
// brand is identified by `brandSlug`. The legacy `brand` string is kept
// on every product and always matches the Brand name.
export const BRANDS = [
  { name: "OMXMO", slug: "omxmo", logo: "", description: "" },
  { name: "DV", slug: "dv", logo: "", description: "" },
  { name: "SY", slug: "sy", logo: "", description: "" },
  { name: "i20", slug: "i20", logo: "", description: "" },
  { name: "Buds Pro 9", slug: "buds-pro-9", logo: "", description: "" },
  { name: "GREAT NICE", slug: "great-nice", logo: "", description: "" },
  // Batch 1 (28 Nov 2026, from Zain's WhatsApp catalog screenshots):
  // URPIN is the brand on the box. Buds Pro 2 / Buds Pro 5 follow the
  // Buds Pro 9 precedent (brand = product name, no brand invented).
  { name: "URPIN", slug: "urpin", logo: "", description: "" },
  { name: "Buds Pro 2", slug: "buds-pro-2", logo: "", description: "" },
  { name: "Buds Pro 3", slug: "buds-pro-3", logo: "", description: "" },
  { name: "Buds Pro 4", slug: "buds-pro-4", logo: "", description: "" },
  { name: "Buds Pro 5", slug: "buds-pro-5", logo: "", description: "" },
];

export function getCategory(slug) {
  if (slug === "all") return { slug: "all", name: "All Products", blurb: "Everything at AI Communication." };
  return CATEGORIES.find((c) => c.slug === slug) || null;
}

export const PRODUCTS = [
  // ---- Power banks: OX-PD10 replaced by the catalog version (Batch 2,
  // 28 Nov 2026). The old seed price Rs 3,200 was a researched estimate;
  // the catalog price is Rs 2,600 (was 3,000). Warranty 6 months, per Zain.
  {
    id: "omxmo-ox-pd10",
    slug: "omxmo-ox-pd10",
    name: "OMXMO OX-PD10 10000mAh Fast Charging Power Bank",
    brand: "OMXMO",
    brandSlug: "omxmo",
    brandId: null,
    model: "OX-PD10",
    category: "power-banks",
    pricePKR: 2600,
    compareAtPricePKR: 3000,
    stock: null,
    warrantyMonths: 6,
    weightKg: 0.3,
    shortDesc: "Slim, pocket-friendly 10000mAh power bank with SCP 22.5W SuperCharge, PD 20W fast charging, built-in dual cables and LCD display.",
    specs: {
      Capacity: "10,000mAh High-Density Polymer Battery",
      "Fast charging": "SCP 22.5W SuperCharge & PD 20W Power Delivery",
      "Cables & Ports": "Built-in Type-C and Lightning output cables tucked neatly into the body, alongside top charging ports for simultaneous multi-device connectivity",
      "Design & Display": "Built-in LCD digital battery percentage screen (100%), sleek compact profile, available in Black and White finishes",
    },
    features: [],
    images: [
      "/products/omxmo-ox-pd10-1.jpg",
      "/products/omxmo-ox-pd10-2.jpg",
      "/products/omxmo-ox-pd10-3.jpg",
      "/products/omxmo-ox-pd10-4.jpg",
    ],
    isFeatured: true,
    isNew: true,
  },
  // ---- Power banks, Batch 2 (28 Nov 2026, Zain's WhatsApp catalog).
  // All OMXMO, all 6 months warranty, prices are Zain's catalog prices.
  {
    id: "omxmo-ox-pd01",
    slug: "omxmo-ox-pd01",
    name: "OMXMO OX-PD01 10000mAh PD Fast Charge Power Bank",
    brand: "OMXMO",
    brandSlug: "omxmo",
    brandId: null,
    model: "OX-PD01",
    category: "power-banks",
    pricePKR: 2200,
    compareAtPricePKR: 2800,
    stock: null,
    warrantyMonths: 6,
    weightKg: 0.3,
    shortDesc: "Sleek 10000mAh power bank with 22.5W SCP and 20W PD fast charging, multi-port output and textured anti-slip body.",
    specs: {
      Capacity: "10,000mAh High-Density Polymer Battery",
      "Fast charging": "22.5W SCP SuperCharge & 20W PD Power Delivery",
      Ports: "Dual USB output ports, Type-C input/output port, and Micro-USB input port",
      "Design & Display": "Textured anti-slip surface, subtle LED indicator lights, 10000 capacity branding, available in Black and White finishes",
    },
    features: [],
    images: [
      "/products/omxmo-ox-pd01-1.jpg",
      "/products/omxmo-ox-pd01-2.jpg",
      "/products/omxmo-ox-pd01-3.jpg",
    ],
    isFeatured: false,
    isNew: true,
  },
  {
    id: "omxmo-ox-pd02",
    slug: "omxmo-ox-pd02",
    name: "OMXMO OX-PD02 20000mAh PD Fast Charge Power Bank",
    brand: "OMXMO",
    brandSlug: "omxmo",
    brandId: null,
    model: "OX-PD02",
    category: "power-banks",
    pricePKR: 3200,
    compareAtPricePKR: 3800,
    stock: null,
    warrantyMonths: 6,
    weightKg: 0.4,
    shortDesc: "High-capacity 20000mAh power bank with 22.5W SCP and 20W PD fast charging, multi-port connectivity and textured anti-slip body.",
    specs: {
      Capacity: "20,000mAh High-Density Polymer Battery",
      "Fast charging": "22.5W SCP SuperCharge & 20W PD Power Delivery",
      Ports: "Dual USB output ports, Type-C input/output port, and Micro-USB input port",
      "Design & Display": "Textured anti-slip surface, subtle LED indicator lights, 20000 capacity branding, available in Black and White finishes",
    },
    features: [],
    images: [
      "/products/omxmo-ox-pd02-1.jpg",
      "/products/omxmo-ox-pd02-2.jpg",
    ],
    isFeatured: false,
    isNew: true,
  },
  {
    id: "omxmo-ox-pd03",
    slug: "omxmo-ox-pd03",
    name: "OMXMO OX-PD03 30000mAh PD Fast Charge Power Bank",
    brand: "OMXMO",
    brandSlug: "omxmo",
    brandId: null,
    model: "OX-PD03",
    category: "power-banks",
    pricePKR: 4200,
    compareAtPricePKR: 4800,
    stock: null,
    warrantyMonths: 6,
    weightKg: 0.5,
    shortDesc: "Ultra-high-capacity 30000mAh power bank with 22.5W SCP and 20W PD fast charging, multi-port connectivity and textured anti-slip body.",
    specs: {
      Capacity: "30,000mAh Ultra-High Capacity Polymer Battery",
      "Fast charging": "22.5W SCP SuperCharge & 20W PD Power Delivery",
      Ports: "Dual USB output ports, Type-C input/output port, and Micro-USB input port",
      "Design & Display": "Textured anti-slip surface, subtle LED indicator lights, 30000 capacity branding, available in Black and White finishes",
    },
    features: [],
    images: [
      "/products/omxmo-ox-pd03-1.jpg",
      "/products/omxmo-ox-pd03-2.jpg",
    ],
    isFeatured: false,
    isNew: true,
  },
  {
    id: "omxmo-ox-pd11",
    slug: "omxmo-ox-pd11",
    name: "OMXMO OX-PD11 20000mAh Fast Charging Power Bank",
    brand: "OMXMO",
    brandSlug: "omxmo",
    brandId: null,
    model: "OX-PD11",
    category: "power-banks",
    pricePKR: 3600,
    compareAtPricePKR: 4000,
    stock: null,
    warrantyMonths: 6,
    weightKg: 0.4,
    shortDesc: "High-capacity 20000mAh power bank with SCP 22.5W SuperCharge, PD 20W fast charging, integrated dual cables and LCD display.",
    specs: {
      Capacity: "20,000mAh High-Density Polymer Battery",
      "Fast charging": "SCP 22.5W SuperCharge & PD 20W Power Delivery",
      "Cables & Ports": "Integrated dual charging cables (tucked neatly into the body) alongside multiple top USB-A and Type-C ports for multi-device connectivity",
      "Design & Display": "Built-in LCD digital battery indicator (100%), vertical OMXMO 22.5W | PD 20W branding stripe, available in Black and White finishes",
    },
    features: [],
    images: [
      "/products/omxmo-ox-pd11-1.jpg",
      "/products/omxmo-ox-pd11-2.jpg",
      "/products/omxmo-ox-pd11-3.jpg",
    ],
    isFeatured: false,
    isNew: true,
  },
  {
    id: "omxmo-ox-pd12",
    slug: "omxmo-ox-pd12",
    name: "OMXMO OX-PD12 30000mAh Fast Charging Power Bank",
    brand: "OMXMO",
    brandSlug: "omxmo",
    brandId: null,
    model: "OX-PD12",
    category: "power-banks",
    pricePKR: 4600,
    compareAtPricePKR: 5000,
    stock: null,
    warrantyMonths: 6,
    weightKg: 0.5,
    shortDesc: "Ultra-high-capacity 30000mAh power bank with SCP 22.5W SuperCharge, PD 20W fast charging, built-in dual cables and orange lanyard strap.",
    specs: {
      Capacity: "30,000mAh Ultra-High Capacity Polymer Battery",
      "Fast charging": "SCP 22.5W SuperCharge & PD 20W Power Delivery",
      "Cables & Ports": "Integrated dual charging cables tucked into the back slots, alongside multiple top USB-A and Type-C input/output ports",
      "Design & Display": "Digital octagonal LED screen showing battery percentage (100%), attached orange lanyard strap, available in Black and White finishes",
    },
    features: [],
    images: [
      "/products/omxmo-ox-pd12-1.jpg",
      "/products/omxmo-ox-pd12-2.jpg",
      "/products/omxmo-ox-pd12-3.jpg",
      "/products/omxmo-ox-pd12-4.jpg",
      "/products/omxmo-ox-pd12-5.jpg",
    ],
    isFeatured: false,
    isNew: true,
  },
  {
    id: "omxmo-ox-pd13",
    slug: "omxmo-ox-pd13",
    name: "OMXMO OX-PD13 50000mAh Fast Charging Power Bank",
    brand: "OMXMO",
    brandSlug: "omxmo",
    brandId: null,
    model: "OX-PD13",
    category: "power-banks",
    pricePKR: 6000,
    compareAtPricePKR: 6500,
    stock: null,
    warrantyMonths: 6,
    weightKg: 0.7,
    shortDesc: "Massive-capacity 50000mAh industrial power bank with SCP 22.5W SuperCharge, PD 20W fast charging, built-in dual cables and LED display.",
    specs: {
      Capacity: "50,000mAh Ultra-High Capacity Polymer Battery",
      "Fast charging": "SCP 22.5W SuperCharge & PD 20W Power Delivery",
      "Cables & Ports": "Integrated dual charging cables tucked into the body alongside multiple top USB ports for heavy-duty multi-device connectivity",
      "Design & Display": "Clear digital LED screen displaying battery percentage, orange lanyard carry strap, available in Black and White finishes",
    },
    features: [],
    images: [
      "/products/omxmo-ox-pd13-1.jpg",
      "/products/omxmo-ox-pd13-2.jpg",
      "/products/omxmo-ox-pd13-3.jpg",
    ],
    isFeatured: false,
    isNew: true,
  },
  {
    id: "omxmo-ox-pd15",
    slug: "omxmo-ox-pd15",
    name: "OMXMO OX-PD15 20000mAh Fast Charging Power Bank",
    brand: "OMXMO",
    brandSlug: "omxmo",
    brandId: null,
    model: "OX-PD15",
    category: "power-banks",
    pricePKR: 3600,
    compareAtPricePKR: 4000,
    stock: null,
    warrantyMonths: 6,
    weightKg: 0.4,
    shortDesc: "High-capacity 20000mAh power bank with SCP 22.5W and PD 20W super-fast charging, built-in dual cables, carry strap loop and LED display.",
    specs: {
      Capacity: "20,000mAh High-Density Polymer Battery",
      "Fast charging": "SCP 22.5W SuperCharge & PD 20W Power Delivery",
      "Cables & Ports": "Integrated Type-C and Lightning output cables tucked neatly into the body, plus top USB-A and Type-C input/output ports",
      "Design & Display": "Digital LED battery indicator (100%), convenient side carry lanyard loop, available in Black and White finishes",
    },
    features: [],
    images: [
      "/products/omxmo-ox-pd15-1.jpg",
      "/products/omxmo-ox-pd15-2.jpg",
      "/products/omxmo-ox-pd15-3.jpg",
      "/products/omxmo-ox-pd15-4.jpg",
    ],
    isFeatured: false,
    isNew: true,
  },
  {
    id: "omxmo-ox-pd16",
    slug: "omxmo-ox-pd16",
    name: "OMXMO OX-PD16 30000mAh Fast Charging Power Bank",
    brand: "OMXMO",
    brandSlug: "omxmo",
    brandId: null,
    model: "OX-PD16",
    category: "power-banks",
    pricePKR: 4600,
    compareAtPricePKR: 5000,
    stock: null,
    warrantyMonths: 6,
    weightKg: 0.5,
    shortDesc: "Ultra-high-capacity 30000mAh power bank with SCP 22.5W SuperCharge, PD 20W fast charging, built-in dual cables and LED display.",
    specs: {
      Capacity: "30,000mAh Ultra-High Capacity Polymer Battery",
      "Fast charging": "SCP 22.5W SuperCharge & PD 20W Power Delivery",
      "Cables & Ports": "Integrated dual charging cables, USB-A, and Type-C charging ports for simultaneous multi-device connectivity",
      "Design & Display": "Large digital LED battery indicator, integrated lanyard strap, available in sleek Black and White color finishes",
    },
    features: [],
    images: [
      "/products/omxmo-ox-pd16-1.jpg",
      "/products/omxmo-ox-pd16-2.jpg",
      "/products/omxmo-ox-pd16-3.jpg",
    ],
    isFeatured: false,
    isNew: true,
  },
  // ---- Hero 2: Speaker ----
  {
    id: "dv-1089",
    slug: "dv-1089",
    name: "DV-1089 Wireless Speaker",
    brand: "DV",
    brandSlug: "dv",
    brandId: null,
    model: "DV-1089",
    category: "speakers",
    pricePKR: 1250,
    compareAtPricePKR: null,
    stock: null,
    warrantyMonths: 0,
    weightKg: 0.8,
    shortDesc: "Wireless speaker with phone-holder slot and solar panel back.",
    specs: {
      "Phone holder": "Top slot for your phone",
      "Solar panel": "Solar panel on back",
      Inputs: "FM radio / USB / TF card",
      Colours: "Black / Blue-grey",
      Strap: "Carry strap",
    },
    features: [],
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
    brandSlug: "sy",
    brandId: null,
    model: "SY-777",
    category: "speakers",
    pricePKR: 1500,
    compareAtPricePKR: null,
    stock: null,
    warrantyMonths: 0,
    weightKg: 0.4,
    shortDesc: "Small square wireless speaker with RGB LED ring.",
    specs: { Lights: "RGB LED ring", Colours: "Blue / Lime-green / Orange", Strap: "Carry strap" },
    features: [],
    images: ["/products/sy-777-blue.jpg", "/products/sy-777-colours.jpg"],
    isFeatured: true,
    isNew: true,
  },
  // ---- Hero 4: Smartwatch ----
  {
    id: "i20-ultra-max-suit",
    slug: "i20-ultra-max-suit",
    name: "i20 ULTRA MAX SUIT Smartwatch, 10 in 1 Set",
    brand: "i20",
    brandSlug: "i20",
    brandId: null,
    model: "i20 ULTRA MAX SUIT BIG 2.3",
    category: "smartwatches",
    pricePKR: 2500,
    compareAtPricePKR: null,
    stock: null,
    warrantyMonths: 0,
    weightKg: 0.5,
    shortDesc: "Watch + earphones together in one box, 10 in 1 set.",
    specs: { Display: "BIG 2.3 Infinite Display", Set: "10 in 1 (watch + earphones)" },
    features: [],
    images: ["/products/i20-ultra-max-suit.png"],
    isFeatured: true,
    isNew: true,
  },
  // ---- New: Earbuds (from the WhatsApp review screenshot) ----
  {
    id: "buds-pro-9",
    slug: "buds-pro-9",
    name: "Buds Pro 9 Wireless Earbuds",
    // The brand is "Buds Pro 9": that is what the box says. No brand
    // is invented for this product.
    brand: "Buds Pro 9",
    brandSlug: "buds-pro-9",
    brandId: null,
    model: "Buds Pro 9",
    category: "earbuds",
    pricePKR: 2300,
    compareAtPricePKR: null,
    stock: null,
    warrantyMonths: 0,
    weightKg: 0.2,
    shortDesc: "TWS earbuds with ANC/ENC Double Dark Noise Reduction and touch control.",
    specs: {
      "ANC/ENC": "Double Dark Noise Reduction",
      Control: "Touch Control",
      Colours: "Beige / White and Black",
    },
    features: [],
    // Cropped from the review screenshot by the foundation agent.
    images: ["/products/buds-pro-9-beige.jpg", "/products/buds-pro-9-black.jpg"],
    isFeatured: true,
    isNew: true,
  },
  // ---- New: Party speaker (from the WhatsApp review screenshot) ----
  {
    id: "great-nice-gts-2190",
    slug: "great-nice-gts-2190",
    name: "GREAT NICE Wireless Party Speaker GTS-2190",
    brand: "GREAT NICE",
    brandSlug: "great-nice",
    brandId: null,
    model: "GTS-2190",
    category: "speakers",
    pricePKR: 1750,
    compareAtPricePKR: null,
    stock: null,
    warrantyMonths: 0,
    weightKg: 2.5,
    shortDesc: "4 inch wireless party speaker with LED lights and big sound.",
    specs: {
      Size: "4 inch",
      Lights: "LED lights",
      Sound: "Big sound",
      Speakers: "Dual speakers",
      LED: "Blue / Green LED",
      Model: "GTS-2190",
    },
    features: [],
    // Cropped from the review screenshot by the foundation agent.
    images: ["/products/great-nice-speaker.jpg", "/products/great-nice-box.jpg"],
    isFeatured: false,
    isNew: true,
  },
  // ---- Batch 1 (28 Nov 2026): Earbuds from Zain's WhatsApp catalog ----
  // Prices are Zain's catalog prices (first number = sale price, second
  // number = struck-through compare-at price). Descriptions and specs are
  // transcribed from the catalog detail screenshots he sent (28 Nov).
  // Buds Pro 3 and Buds Pro 4 are NOT added here: their RAR folder holds
  // only Gemini-generated images, no real product photos. Zain is asked
  // for real photos before those two are listed.
  {
    id: "urpin-ua-30-pro",
    slug: "urpin-ua-30-pro",
    name: "Urpin UA-30 Pro Premium Earbuds",
    brand: "URPIN",
    brandSlug: "urpin",
    brandId: null,
    model: "UA-30 Pro",
    category: "earbuds",
    pricePKR: 2150,
    compareAtPricePKR: 2400,
    stock: null,
    warrantyMonths: 6,
    weightKg: 0.2,
    shortDesc: "Premium earbuds with ENC noise reduction, Bluetooth 5.3 and up to 5 hours playtime.",
    specs: {
      Sound: "High-fidelity audio drivers, deep bass, clear mids, crisp highs",
      "Noise reduction": "ENC Environmental Noise Cancellation",
      Bluetooth: "5.3, stable, instant connection, lower power consumption",
      Design: "Ergonomic, secure and comfortable fit for all-day wear",
      Controls: "Smart touch controls for music, volume and calls",
      Battery: "Up to 5 hours playtime on a single charge, extended via charging case",
      Compatibility: "Works with iOS and Android devices",
    },
    features: [],
    images: [
      "/products/urpin-ua-30-pro-1.jpg",
      "/products/urpin-ua-30-pro-2.jpg",
      "/products/urpin-ua-30-pro-3.jpg",
      "/products/urpin-ua-30-pro-4.jpg",
      "/products/urpin-ua-30-pro-5.jpg",
      "/products/urpin-ua-30-pro-6.jpg",
    ],
    isFeatured: false,
    isNew: true,
  },
  {
    id: "urpin-ua-50-pro",
    slug: "urpin-ua-50-pro",
    name: "Urpin UA-50 Pro Wireless Earbuds",
    brand: "URPIN",
    brandSlug: "urpin",
    brandId: null,
    model: "UA-50 Pro",
    category: "earbuds",
    pricePKR: 2250,
    compareAtPricePKR: 2500,
    stock: null,
    warrantyMonths: 6,
    weightKg: 0.2,
    shortDesc: "Premium earbuds with Quad-Mic ENC, Bluetooth 5.4 and 24-hour total playtime.",
    specs: {
      Playtime: "24-hour total playtime with portable charging case",
      "Noise reduction": "Advanced Quad-Mic ENC for crystal-clear calls",
      Bluetooth: "5.4, instant pairing, stable connection, ultra-low latency for gaming",
      Design: "Ergonomic, secure fit for daily wear and workouts",
      Charging: "Touch control and Type-C fast charging",
      "Water resistant": "Built to withstand sweat and daily splash exposure",
    },
    features: [],
    images: [
      "/products/urpin-ua-50-pro-1.jpg",
      "/products/urpin-ua-50-pro-2.jpg",
      "/products/urpin-ua-50-pro-3.jpg",
      "/products/urpin-ua-50-pro-4.jpg",
      "/products/urpin-ua-50-pro-5.jpg",
      "/products/urpin-ua-50-pro-6.jpg",
      "/products/urpin-ua-50-pro-7.jpg",
    ],
    isFeatured: false,
    isNew: true,
  },
  {
    id: "urpin-ua-60-pro",
    slug: "urpin-ua-60-pro",
    name: "Urpin UA-60 Pro Wireless Earbuds",
    brand: "URPIN",
    brandSlug: "urpin",
    brandId: null,
    model: "UA-60 Pro",
    category: "earbuds",
    pricePKR: 2350,
    compareAtPricePKR: 2600,
    stock: null,
    warrantyMonths: 6,
    weightKg: 0.2,
    shortDesc: "Premium studio sound earbuds with Dual Mic ENC, 20 hours playtime and Type-C rapid charging.",
    specs: {
      Driver: "10mm Dynamic Bass Driver, deep bass and rich sound",
      "Noise reduction": "Dual Mic ENC for clear, distortion-free calls",
      Playtime: "20 hours, extended standby time",
      Charging: "Type-C rapid charging",
      Bluetooth: "V5.3, fast, stable, low-latency",
      Design: "Lightweight, comfortable fit for long listening sessions",
      Controls: "Smart touch controls for music, calls and volume",
      Colours: "White, Black, Beige, Blue",
    },
    features: [],
    images: [
      "/products/urpin-ua-60-pro-1.jpg",
      "/products/urpin-ua-60-pro-2.jpg",
      "/products/urpin-ua-60-pro-3.jpg",
      "/products/urpin-ua-60-pro-4.jpg",
      "/products/urpin-ua-60-pro-5.jpg",
      "/products/urpin-ua-60-pro-6.jpg",
    ],
    isFeatured: false,
    isNew: true,
  },
  {
    id: "buds-pro-2",
    slug: "buds-pro-2",
    name: "Buds Pro 2 Wireless Earbuds",
    // The brand is "Buds Pro 2": that is what the box says, same as
    // Buds Pro 9. No brand is invented for this product.
    brand: "Buds Pro 2",
    brandSlug: "buds-pro-2",
    brandId: null,
    model: "Buds Pro 2",
    category: "earbuds",
    pricePKR: 1000,
    compareAtPricePKR: 1300,
    stock: null,
    warrantyMonths: 0,
    weightKg: 0.2,
    shortDesc: "High-fidelity earbuds with Qi wireless charging support and USB-C rapid charging.",
    specs: {
      Connectivity: "Latest-generation wireless, pairs with iOS, Android and Windows",
      Audio: "Precision-tuned drivers, clear highs, balanced bass response",
      Design: "Ergonomic, lightweight, secure fit for all-day comfort",
      Charging: "USB-C rapid charging",
      Compatibility: "Qi-certified wireless chargers",
      Build: "Premium glossy finish, compact pocket-friendly charging case",
    },
    features: [],
    images: [
      "/products/buds-pro-2-1.jpg",
      "/products/buds-pro-2-2.jpg",
      "/products/buds-pro-2-3.jpg",
      "/products/buds-pro-2-4.jpg",
      "/products/buds-pro-2-5.jpg",
      "/products/buds-pro-2-6.jpg",
    ],
    isFeatured: false,
    isNew: true,
  },
  {
    id: "buds-pro-3",
    slug: "buds-pro-3",
    name: "Buds Pro 3 Wireless Earbuds",
    // The brand is "Buds Pro 3": that is what the box says, same as
    // Buds Pro 9. No brand is invented for this product.
    brand: "Buds Pro 3",
    brandSlug: "buds-pro-3",
    brandId: null,
    model: "Buds Pro 3",
    category: "earbuds",
    pricePKR: 1100,
    compareAtPricePKR: 1400,
    stock: null,
    warrantyMonths: 0,
    weightKg: 0.2,
    shortDesc: "TWS wireless earbuds with crisp sound, crystal-clear calls, 5-6 hours playtime and IPX4 water resistance.",
    specs: {
      Audio: "Crisp sound, crystal-clear calls, seamless connectivity",
      Playtime: "5-6 hours of continuous music playback and talk time on a single charge",
      "Water resistance": "IPX4, handles sweat, splashes and light rain",
      Design: "Ergonomic, secure, comfortable fit with intuitive touch controls",
      Colours: "Available in white and black",
    },
    features: [],
    images: [
      "/products/buds-pro-3-1.jpg",
      "/products/buds-pro-3-2.jpg",
      "/products/buds-pro-3-3.jpg",
      "/products/buds-pro-3-4.jpg",
    ],
    isFeatured: false,
    isNew: true,
  },
  {
    id: "buds-pro-4",
    slug: "buds-pro-4",
    name: "Buds Pro 4 Wireless Earbuds",
    // The brand is "Buds Pro 4": that is what the box says, same as
    // Buds Pro 9. No brand is invented for this product.
    brand: "Buds Pro 4",
    brandSlug: "buds-pro-4",
    brandId: null,
    model: "Buds Pro 4",
    category: "earbuds",
    pricePKR: 1200,
    compareAtPricePKR: 1500,
    stock: null,
    warrantyMonths: 0,
    weightKg: 0.2,
    shortDesc: "Premium earbuds with mirror-finish chrome lid, 3 voice changer modes, HD stereo sound and low-latency Bluetooth.",
    specs: {
      Design: "Stylish mirror-finish chrome lid, smooth body design",
      Audio: "Crystal-clear HD stereo sound, deep bass, balanced output",
      "Voice changer": "3 built-in modes (Fun, Deep, Normal) for calls and gaming",
      Connection: "Fast, stable Bluetooth with low-latency performance for gaming",
      Controls: "Smart touch control with volume control",
      Charging: "Long battery backup, portable charging case included",
    },
    features: [],
    images: [
      "/products/buds-pro-4-1.jpg",
      "/products/buds-pro-4-2.jpg",
      "/products/buds-pro-4-3.jpg",
      "/products/buds-pro-4-4.jpg",
      "/products/buds-pro-4-5.jpg",
      "/products/buds-pro-4-6.jpg",
    ],
    isFeatured: false,
    isNew: true,
  },
  {
    id: "buds-pro-5",
    slug: "buds-pro-5",
    name: "Buds Pro 5 Wireless Earbuds",
    // The brand is "Buds Pro 5": that is what the box says, same as
    // Buds Pro 9. No brand is invented for this product.
    brand: "Buds Pro 5",
    brandSlug: "buds-pro-5",
    brandId: null,
    model: "Buds Pro 5",
    category: "earbuds",
    pricePKR: 1300,
    compareAtPricePKR: 1600,
    stock: null,
    warrantyMonths: 0,
    weightKg: 0.2,
    shortDesc: "Premium earbuds with Hybrid ANC/ENC, diamond-cut metallic texture and dual-device connection.",
    specs: {
      Sound: "High-fidelity studio sound quality",
      "Noise cancellation": "Hardware-level Hybrid Noise Cancellation (ANC/ENC support)",
      Connection: "Smart Dual-Device connection for seamless switching",
      Charging: "Type-C fast charging, long-lasting battery backup",
      Design: "Diamond-cut metallic texture, stands out from standard plastic clones",
      Code: "ZEE-BUDS05",
    },
    features: [],
    images: [
      "/products/buds-pro-5-1.jpg",
      "/products/buds-pro-5-2.jpg",
      "/products/buds-pro-5-3.jpg",
      "/products/buds-pro-5-4.jpg",
      "/products/buds-pro-5-5.jpg",
      "/products/buds-pro-5-6.jpg",
      "/products/buds-pro-5-7.jpg",
    ],
    isFeatured: false,
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
  return BRANDS.map((b) => ({ ...b }));
}

// Price display rule: no price is ever invented. pricePKR is null until Zain
// supplies his price list (Phase 2 seed). Callers must use this helper.
export function formatPrice(pricePKR) {
  if (pricePKR === null || pricePKR === undefined) return null;
  return `Rs. ${Number(pricePKR).toLocaleString("en-PK")}`;
}
