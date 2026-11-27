import mongoose from "mongoose";

// Brand taxonomy for the V3 storefront (/brands, /brands/[slug]) and for
// the admin brand manager. Products link here via brandId; the legacy
// free-text `brand` string on Product is kept in parallel during the
// migration so old data and the seed catalogue keep working.
const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String, default: "" },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Brand || mongoose.model("Brand", brandSchema);
