// One-time removal of the 5 sample products (28 Nov 2026).
//
// Zain's instruction: remove all products added when the website was
// created that were samples with wrong (estimated) info. The 5 are:
// - DV-1089 (returns with the Speakers batch; its review is re-added then)
// - SY-777 (returns with the Speakers batch)
// - i20 ULTRA MAX SUIT (returns with the Smartwatches batch)
// - Buds Pro 9 (never in the catalog, one-off stock; does not return)
// - GREAT NICE GTS-2190 (same as Buds Pro 9; does not return)
//
// The seed has NO prune step, so removing them from src/lib/products.js
// alone does NOT remove them from MongoDB. This script deletes them from
// the DB, plus their 3 WhatsApp reviews (which would otherwise be
// orphaned) and their 5 now-empty brands, plus the old hero section that
// featured DV-1089 (the seed creates the new OX-PD13 hero; this deletes
// the old DV-1089 hero so there is no duplicate).
//
// Run ONCE, AFTER the seed (the seed creates the new hero section; this
// removes the old one). Do NOT run it again.
//
//   node --env-file=.env.local scripts/remove-sample-products.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import Product from "../src/models/Product.js";
import Review from "../src/models/Review.js";
import Brand from "../src/models/Brand.js";
import HomepageSection from "../src/models/HomepageSection.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .env.local the same way seed.mjs does.
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
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

const PRODUCT_SLUGS = [
  "dv-1089",
  "sy-777",
  "i20-ultra-max-suit",
  "buds-pro-9",
  "great-nice-gts-2190",
];
const BRAND_SLUGS = ["dv", "sy", "i20", "buds-pro-9", "great-nice"];

await mongoose.connect(uri, { bufferCommands: false, maxPoolSize: 10 });

// Collect the products' ids first so their reviews can be deleted too.
const products = await Product.find({ slug: { $in: PRODUCT_SLUGS } }, { _id: 1, slug: 1 });
const productIds = products.map((p) => p._id);
console.log(`found products: ${products.map((p) => p.slug).join(", ") || "(none)"}`);

const reviewRes = await Review.deleteMany({ productId: { $in: productIds } });
console.log(`deleted reviews: ${reviewRes.deletedCount}`);

const productRes = await Product.deleteMany({ slug: { $in: PRODUCT_SLUGS } });
console.log(`deleted products: ${productRes.deletedCount}`);

const brandRes = await Brand.deleteMany({ slug: { $in: BRAND_SLUGS } });
console.log(`deleted brands: ${brandRes.deletedCount}`);

// Old hero section (DV-1089). The seed already created the new OX-PD13
// hero; this removes the old one so the homepage has a single hero.
const heroRes = await HomepageSection.deleteMany({
  type: "hero",
  title: "DV-1089 Wireless Speaker",
});
console.log(`deleted old hero sections: ${heroRes.deletedCount}`);

await mongoose.disconnect();
console.log("Done. Do not run this script again.");
