import mongoose from "mongoose";

// No size/material/gender fields — this is a mobile-accessories shop, not
// the old fashion template. pricePKR is nullable BY DESIGN: null means
// "WhatsApp for price" and must never be replaced with an invented price.
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    // Category is stored as a slug string (must match a Category slug).
    category: { type: String, required: true, trim: true },
    pricePKR: { type: Number, default: null, min: 0 },
    compareAtPricePKR: { type: Number, default: null, min: 0 },
    // null = stock is not tracked yet (seed products). A number means the
    // admin set it; orders then enforce it and decrement on order.
    stock: { type: Number, default: null, min: 0 },
    // Cloudinary URLs (admin upload). Local /public paths are also accepted
    // for the Phase 1 seed images until they are re-uploaded.
    images: { type: [String], default: [] },
    shortDesc: { type: String, default: "" },
    // Only confirmed facts (from the box/photo). Free-form key/value.
    specs: { type: mongoose.Schema.Types.Mixed, default: {} },
    features: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, active: 1 });
productSchema.index({ brand: 1 });

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);
