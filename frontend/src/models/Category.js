import mongoose from "mongoose";

// Category IS the Collection model (V3 plan sec 7.1). The category
// taxonomy (earbuds, smartwatches, power-banks, speakers, chargers,
// handsfree) already feeds /collections/[slug], the nav and the category
// tiles, so collections are built on it instead of a second model:
// a manual collection is a hand-picked ordered product list, a rule
// collection resolves its products from conditions. Existing slugs and
// routes keep working unchanged.
const ruleSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["category", "brand", "tag", "onSale", "new"],
      default: "new",
    },
    brand: { type: String, default: "" },
    tag: { type: String, default: "" },
    windowDays: { type: Number, default: 30, min: 1 },
    limit: { type: Number, default: 24, min: 1, max: 100 },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Short shop-facing line shown under the category name.
    blurb: { type: String, default: "" },
    image: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    // Collection fields (V3). type "manual" uses the ordered products
    // list; type "rule" resolves from `rule` at read time.
    type: { type: String, enum: ["manual", "rule"], default: "manual" },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    rule: { type: ruleSchema, default: () => ({}) },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Category ||
  mongoose.model("Category", categorySchema);
