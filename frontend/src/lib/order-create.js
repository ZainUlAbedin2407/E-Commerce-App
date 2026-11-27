// Shared server-side order creation (V3).
//
// BOTH the public POST /api/orders and the admin draft-order route use
// this module, so pricing, delivery fees, COD rules and stock handling
// can never drift apart. Client-supplied prices/totals are NEVER
// trusted: products are re-read from MongoDB and every total is
// computed here. Callers must connectDB() first.

// NOTE: this module imports Mongoose models directly, so it is for
// server use only (API routes), never for client components.

import Order from "@/models/Order";
import Product from "@/models/Product";
import Counter from "@/models/Counter";
import { getDbProductBySlug, getSettings } from "./catalog";
import {
  deliveryFeePKR,
  COD_MAX_TOTAL_PKR,
  DELIVERY_KARACHI_PKR,
  DELIVERY_OTHER_PKR,
  DELIVERY_FREE_UP_TO_KG,
  DELIVERY_EXTRA_KG_PKR,
  isKarachi,
} from "./site";

// --- Atomic order numbers (audit H1) ---
// Order numbers must never come from Order.countDocuments(): two
// simultaneous orders compute the same number and the loser fails with a
// duplicate-key error after its stock was already decremented.
export async function nextOrderNo() {
  let counter = await Counter.findById("orderNo").lean();
  if (!counter) {
    // First use: start AFTER the orders that already exist (AIC-0001,
    // AIC-0002, …) so the counter can never collide with them.
    const existing = await Order.countDocuments();
    try {
      counter = await Counter.create({ _id: "orderNo", seq: existing });
    } catch (err) {
      if (err?.code !== 11000) throw err;
      // Another request created it first, fall through to the increment.
    }
  }
  counter = await Counter.findOneAndUpdate(
    { _id: "orderNo" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `AIC-${String(counter.seq).padStart(4, "0")}`;
}

// If order creation fails after stock was decremented, give the stock back.
export async function compensateStock(decremented) {
  for (const { productId, qty } of decremented) {
    try {
      await Product.findByIdAndUpdate(productId, { $inc: { stock: qty } });
    } catch (err) {
      console.error("Stock compensation failed:", String(productId), err?.message);
    }
  }
}

// Delivery + COD rules: from Settings when the DB is configured (the
// admin edits them), else the site.js constants.
export async function getPaymentRules() {
  try {
    const s = await getSettings();
    return {
      karachiFee: s.delivery?.karachiFee ?? DELIVERY_KARACHI_PKR,
      otherFee: s.delivery?.otherFee ?? DELIVERY_OTHER_PKR,
      freeUpToKg: s.delivery?.freeUpToKg ?? DELIVERY_FREE_UP_TO_KG,
      extraKgFee: s.delivery?.extraKgFee ?? DELIVERY_EXTRA_KG_PKR,
      freeShippingThreshold: s.delivery?.freeShippingThreshold ?? null,
      codMaxTotal: s.codMaxTotal ?? COD_MAX_TOTAL_PKR,
    };
  } catch {
    return {
      karachiFee: DELIVERY_KARACHI_PKR,
      otherFee: DELIVERY_OTHER_PKR,
      freeUpToKg: DELIVERY_FREE_UP_TO_KG,
      extraKgFee: DELIVERY_EXTRA_KG_PKR,
      freeShippingThreshold: null,
      codMaxTotal: COD_MAX_TOTAL_PKR,
    };
  }
}

// Delivery fee for a city + total weight, under the given rules. A null
// weight means "unknown": the base fee only, no per-kg extra.
export function computeDeliveryFee(city, totalWeightKg, weightsKnown, rules) {
  const base = isKarachi(city) ? rules.karachiFee : rules.otherFee;
  const extraKg = weightsKnown
    ? Math.max(0, Math.ceil(totalWeightKg) - rules.freeUpToKg)
    : 0;
  return base + extraKg * rules.extraKgFee;
}

// Create an order. Returns {order} on success or
// {error: {status, message}} on a customer-facing failure (bad product,
// out of stock, unpriced item, COD above the threshold). Throws only on
// a database failure, which the caller turns into a 503.
export async function createOrder({ customer, items, paymentMethod, status = "Pending", userId = null }) {
  const rules = await getPaymentRules();
  const orderItems = [];
  let subtotal = 0;
  let fail = null;
  let totalWeightKg = 0;
  let weightsKnown = true;
  const decremented = [];

  for (const { slug, qty } of items) {
    const doc = await getDbProductBySlug(slug);
    if (!doc) {
      fail = { status: 400, message: `Product is no longer available: ${slug}.` };
      break;
    }
    // Unpriced products do not go live: fail before any stock moves.
    if (doc.pricePKR == null) {
      fail = {
        status: 400,
        message: `This product is not priced yet: ${doc.name}. Please try again later.`,
      };
      break;
    }
    if (doc.weightKg == null) weightsKnown = false;
    else totalWeightKg += doc.weightKg * qty;
    if (typeof doc.stock === "number") {
      // Atomic conditional decrement: the stock check and the decrement
      // are ONE operation, so two simultaneous orders for the last unit
      // cannot both succeed, the loser gets null and fails cleanly.
      const updated = await Product.findOneAndUpdate(
        { _id: doc._id, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true }
      );
      if (!updated) {
        fail = { status: 400, message: `Out of stock: ${doc.name}.` };
        break;
      }
      decremented.push({ productId: doc._id, qty });
    }
    subtotal += doc.pricePKR * qty;
    orderItems.push({
      productId: doc._id,
      slug: doc.slug,
      name: doc.name,
      model: doc.model,
      image: doc.images?.[0] || "",
      pricePKR: doc.pricePKR,
      qty,
    });
  }

  let deliveryFee = deliveryFeePKR(customer.city, weightsKnown ? totalWeightKg : null);
  // Recompute under the Settings rules when they differ from the
  // site.js constants (deliveryFeePKR above only knows the constants).
  if (
    rules.karachiFee !== DELIVERY_KARACHI_PKR ||
    rules.otherFee !== DELIVERY_OTHER_PKR ||
    rules.freeUpToKg !== DELIVERY_FREE_UP_TO_KG ||
    rules.extraKgFee !== DELIVERY_EXTRA_KG_PKR
  ) {
    deliveryFee = computeDeliveryFee(customer.city, totalWeightKg, weightsKnown, rules);
  }
  if (rules.freeShippingThreshold != null && subtotal >= rules.freeShippingThreshold) {
    deliveryFee = 0;
  }

  // COD only up to codMaxTotal of the FULL total (items + delivery).
  // Above that the customer pays 100% advance. Stock already decremented
  // is compensated by the fail path below.
  if (!fail && paymentMethod === "COD" && subtotal + deliveryFee > rules.codMaxTotal) {
    fail = {
      status: 400,
      message: `Orders above Rs. ${rules.codMaxTotal.toLocaleString("en-PK")} need 100% advance payment. Choose advance payment at checkout.`,
    };
  }

  if (fail) {
    await compensateStock(decremented);
    return { error: fail };
  }

  const isAdvance = paymentMethod === "Advance";
  const orderData = {
    userId,
    items: orderItems,
    subtotalPKR: subtotal,
    deliveryFeePKR: deliveryFee,
    totalPKR: subtotal + deliveryFee,
    customer,
    paymentMethod,
    status,
    // COD cash is collected at delivery; advance stays unpaid until
    // the receipt is verified. Both start "Unpaid".
    paymentStatus: "Unpaid",
    paymentWindowExpiresAt: isAdvance ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
    timeline: [{ status, at: new Date(), note: "Order placed." }],
  };

  // Create with a fresh atomic number; retry once on a duplicate key
  // (near-impossible with the counter, but never fail the customer
  // for it without trying).
  let order = null;
  for (let attempt = 0; attempt < 2 && !order; attempt++) {
    const orderNo = await nextOrderNo();
    try {
      order = await Order.create({ ...orderData, orderNo });
    } catch (err) {
      if (err?.code === 11000) continue;
      await compensateStock(decremented);
      throw err;
    }
  }
  if (!order) {
    await compensateStock(decremented);
    return { error: { status: 409, message: "Order could not be placed. Please try again.", code: "order_conflict" } };
  }
  return { order };
}
