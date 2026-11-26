import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    model: { type: String, default: "" },
    image: { type: String, default: "" },
    // Nullable: null when the price was "WhatsApp for price" at order time.
    pricePKR: { type: Number, default: null },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Generated server-side (AIC-0001, …). Never trust a client-supplied id.
    orderNo: { type: String, required: true, unique: true },
    // Null = guest COD order (no account needed to buy).
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    items: { type: [orderItemSchema], required: true },
    // All nullable: with prices unset, totals are confirmed on WhatsApp.
    subtotalPKR: { type: Number, default: null },
    deliveryFeePKR: { type: Number, default: null },
    totalPKR: { type: Number, default: null },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
    },
    paymentMethod: { type: String, enum: ["COD", "WhatsApp"], default: "COD" },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    whatsappSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
