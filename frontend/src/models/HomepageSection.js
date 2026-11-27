import mongoose from "mongoose";

// HomepageSection: one admin-editable block of the homepage. The
// storefront renders visible sections in `order` order and resolves
// their products server-side (see src/lib/sections.js), so the homepage
// works with the DB or with the local fallback catalogue.
const ruleSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["new", "bestSelling", "category", "onSale", "tag"],
      default: "new",
    },
    category: { type: String, default: "" },
    tag: { type: String, default: "" },
    windowDays: { type: Number, default: 30, min: 1 },
    limit: { type: Number, default: 8, min: 1, max: 50 },
  },
  { _id: false }
);

const homepageSectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["hero", "banner", "categoryTiles", "productRow", "brandsStrip", "trustBadges", "reviewsTeaser"],
      required: true,
    },
    title: { type: String, default: "" },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    sourceType: { type: String, enum: ["manual", "rule"], default: "manual" },
    // Manual list, in display order. For rule sections this is the
    // manual override list (bestSelling puts it first).
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    rule: { type: ruleSchema, default: () => ({}) },
  },
  { timestamps: true }
);

homepageSectionSchema.index({ visible: 1, order: 1 });

export default mongoose.models.HomepageSection ||
  mongoose.model("HomepageSection", homepageSectionSchema);
