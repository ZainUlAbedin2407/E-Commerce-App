// Admin-only helpers shared by the admin API routes.

import mongoose from "mongoose";
import Product from "@/models/Product";

// Resolve a list of product references (Mongo _id strings or slugs, as
// sent by the admin forms) to ObjectIds. Returns {ids, missing}: every
// reference that matches no product is listed in `missing` so the caller
// can reject the request instead of silently dropping a product.
export async function resolveProductIds(refs) {
  const ids = [];
  const missing = [];
  for (const ref of refs || []) {
    const needle = String(ref || "").trim();
    if (!needle) continue;
    let doc = null;
    if (mongoose.Types.ObjectId.isValid(needle)) {
      doc = await Product.findById(needle).select("_id").lean();
    }
    if (!doc) doc = await Product.findOne({ slug: needle }).select("_id").lean();
    if (doc) ids.push(doc._id);
    else missing.push(needle);
  }
  return { ids, missing };
}

export function serializeDoc(doc) {
  const d = doc.toObject ? doc.toObject() : doc;
  return { ...d, id: String(d._id), _id: undefined };
}
