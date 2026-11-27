import mongoose from "mongoose";

// Atomic counters (audit H1). Order numbers must never come from
// `Order.countDocuments()` — two simultaneous orders compute the same
// number and the loser fails with a duplicate-key error after its stock
// was already decremented. A counter document incremented with
// findOneAndUpdate + $inc is atomic: every caller gets a unique sequence.
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export default mongoose.models.Counter ||
  mongoose.model("Counter", counterSchema);
