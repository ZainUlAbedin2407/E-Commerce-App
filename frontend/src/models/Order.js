import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    model: { type: String, default: "" },
    image: { type: String, default: "" },
    // V3: prices are always real numbers. Unpriced products never reach an order.
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
    // V3: totals are always real numbers (see POST /api/orders).
    subtotalPKR: { type: Number, default: null },
    deliveryFeePKR: { type: Number, default: null },
    totalPKR: { type: Number, default: null },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
    },
    paymentMethod: { type: String, enum: ["COD", "Advance"], default: "COD" },
    // Manual advance payment (V3 plan sec 5.2). The customer pays after
    // the order is placed, then uploads the receipt + TRX ID; the order
    // stays PaymentPending until Zain verifies the amount in his own
    // bank/wallet statement. COD orders stay "Unpaid" until delivery.
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "PaymentPending", "Paid", "Failed"],
      default: "Unpaid",
    },
    trxId: { type: String, default: null, trim: true },
    receiptUrl: { type: String, default: null },
    receiptUploadedAt: { type: Date, default: null },
    paymentVerifiedAt: { type: Date, default: null },
    // Advance orders unpaid after 24h are cancelled (plan sec 5.2).
    paymentWindowExpiresAt: { type: Date, default: null },
    // Internal notes (what was agreed with the customer, etc.) and the
    // status timeline. Both are admin-facing only.
    notes: {
      type: [{ text: String, by: String, at: Date }],
      default: [],
    },
    timeline: {
      type: [{ status: String, at: Date, note: String }],
      default: [],
    },
    // Returns, as separate flows (plan sec 7.1): RTO (refused at the
    // door), Defective, ChangeOfMind.
    returnType: {
      type: String,
      enum: [null, "RTO", "Defective", "ChangeOfMind"],
      default: null,
    },
    returnNotes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    whatsappSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Duplicate TRX IDs are the most common receipt fraud pattern (the same
// receipt used for two orders), so they are rejected at the schema level
// as well as in the payment-proof route. Sparse: most orders have no TRX.
orderSchema.index({ trxId: 1 }, { unique: true, sparse: true });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
