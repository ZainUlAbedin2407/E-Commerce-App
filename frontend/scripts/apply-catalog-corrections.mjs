// One-time catalog corrections (Batch 2, 28 Nov 2026).
//
// The seed never overwrites a price or warranty once it is set, so these
// corrections to ALREADY-SEEDED products cannot go through the seed:
// - OMXMO OX-PD10: the old seed price Rs 3,200 was a researched estimate;
//   Zain's catalog price is Rs 2,600 (was 3,000). Warranty 6 months.
// - Urpin UA-30 / UA-50 / UA-60 Pro earbuds: Zain confirmed 6 months
//   warranty (they were seeded with 0 = checking warranty only).
//
// Run ONCE, after the seed, then do not run it again (it would reset any
// price/warranty Zain later changes in admin for these four products):
//
//   node --env-file=.env.local scripts/apply-catalog-corrections.mjs
//
// Idempotent: re-running it sets the same values again, nothing else.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import Product from "../src/models/Product.js";

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

const CORRECTIONS = [
  {
    slug: "omxmo-ox-pd10",
    set: { pricePKR: 2600, compareAtPricePKR: 3000, warrantyMonths: 6 },
    why: "catalog price Rs 2,600 (was 3,000), 6 months warranty",
  },
  {
    slug: "urpin-ua-30-pro",
    set: { warrantyMonths: 6 },
    why: "6 months warranty, per Zain",
  },
  {
    slug: "urpin-ua-50-pro",
    set: { warrantyMonths: 6 },
    why: "6 months warranty, per Zain",
  },
  {
    slug: "urpin-ua-60-pro",
    set: { warrantyMonths: 6 },
    why: "6 months warranty, per Zain",
  },
];

await mongoose.connect(uri, { bufferCommands: false, maxPoolSize: 10 });

for (const c of CORRECTIONS) {
  const res = await Product.updateOne({ slug: c.slug }, { $set: c.set });
  console.log(`${c.slug}: matched ${res.matchedCount}, modified ${res.modifiedCount} (${c.why})`);
}

await mongoose.disconnect();
console.log("Done. Do not run this script again after changing these products in admin.");
