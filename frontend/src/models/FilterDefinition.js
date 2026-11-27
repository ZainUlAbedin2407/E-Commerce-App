import mongoose from "mongoose";

// FilterDefinition: one filter the admin enables, labels and orders on
// collection pages. Values are derived from the products themselves
// (distinct brands, distinct spec values, real min/max price); the admin
// never types filter values by hand.
const filterDefinitionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: ["list", "range", "boolean"], required: true },
    // "brand" | "category" | "price" | "spec:<specKey>" | "availability" | "rating"
    source: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

filterDefinitionSchema.index({ active: 1, sortOrder: 1 });

export default mongoose.models.FilterDefinition ||
  mongoose.model("FilterDefinition", filterDefinitionSchema);
