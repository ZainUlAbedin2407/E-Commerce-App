// Seed the 4 hero products + 6 categories into MongoDB Atlas.
// Idempotent: run it as many times as you like — products are matched by
// slug, and pricePKR / stock are NEVER overwritten (they belong to the
// admin after the first seed; re-running only refreshes names, images,
// specs and flags from the seed file).
//
//   MONGODB_URI="mongodb+srv://..." node scripts/seed.mjs
//   — or, with a local .env.local file:
//   node --env-file=.env.local scripts/seed.mjs
//
// No prices are invented here: every product seeds with pricePKR null
// ("WhatsApp for price") and stock null (untracked until the admin sets it).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { CATEGORIES, PRODUCTS } from "../src/lib/products.js";

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

// Models are imported after the env is loaded; they only need mongoose.
const { default: Category } = await import("../src/models/Category.js");
const { default: Product } = await import("../src/models/Product.js");

await mongoose.connect(uri, { bufferCommands: false, maxPoolSize: 10 });

for (const [i, c] of CATEGORIES.entries()) {
  await Category.updateOne(
    { slug: c.slug },
    { $set: { name: c.name, blurb: c.blurb || "", sortOrder: i, active: true } },
    { upsert: true }
  );
  console.log(`category ok: ${c.slug}`);
}

for (const p of PRODUCTS) {
  await Product.updateOne(
    { slug: p.slug },
    {
      $set: {
        name: p.name,
        brand: p.brand,
        model: p.model,
        category: p.category,
        shortDesc: p.shortDesc || "",
        specs: p.specs || {},
        features: p.features || [],
        images: p.images || [],
        isFeatured: Boolean(p.isFeatured),
        isNew: Boolean(p.isNew),
        active: true,
      },
      $setOnInsert: { pricePKR: null, compareAtPricePKR: null, stock: null },
    },
    { upsert: true }
  );
  console.log(`product ok: ${p.slug} (pricePKR: null — set it in /admin/products)`);
}

await mongoose.disconnect();
console.log("Seed done. Next: register on the site, then run scripts/make-admin.mjs <email> to make the first admin.");
