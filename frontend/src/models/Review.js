import mongoose from "mongoose";

// Review: one source, one model for both review origins (V3 plan sec 6).
// source "whatsapp"/"social" reviews are added by the admin (verified
// true, approved) because the buyer ordered before the website existed.
// source "website" reviews come from the public form and are auto
// approved only when an order with the given orderNo + phone exists and
// is Delivered; otherwise they wait in the moderation queue.
const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    orderNo: { type: String, default: "" },
    phone: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "" },
    body: { type: String, required: true, trim: true },
    photos: { type: [String], default: [] },
    source: { type: String, enum: ["website", "whatsapp", "social"], required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    verified: { type: Boolean, default: false },
    adminReply: { type: String, default: "" },
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Review || mongoose.model("Review", reviewSchema);
