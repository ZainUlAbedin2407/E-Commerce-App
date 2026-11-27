import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Order from "@/models/Order";
import { paymentProofSchema } from "@/lib/validation";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse, sameOriginError } from "@/lib/api-helpers";
import { getSessionFromRequest } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/orders/[id]/payment-proof — customer uploads the receipt
// screenshot + TRX ID for an Advance order. The receipt image is
// uploaded FIRST via /api/upload (image only); this route receives the
// resulting receiptUrl. Body: {trxId, receiptUrl}.
//
// ACCESS: the order owner (signed-in user who owns the order) OR a guest
// presenting the order id. Guest orders have no account, and checkout is
// guest-first, so the order number + the Mongo id in the URL are the
// credential here, exactly like the order-confirmation page: the URL is
// only shown to the buyer who just placed the order (and to the admin).
// A TRX ID is still required and is checked globally, so a guessed URL
// cannot attach a second receipt to an order that already has one, and
// duplicate TRX IDs are rejected outright.
//
// Checks, in order: order exists (404); payment window passed (410, the
// order is marked Cancelled); trxId already on ANY other order (409,
// duplicate TRX ID is the most common receipt fraud pattern); otherwise
// paymentStatus becomes PaymentPending with a timeline entry.
export async function POST(request, { params }) {
  const originErr = sameOriginError(request);
  if (originErr) return originErr;
  const rl = rateLimit(`payment-proof:${clientIp(request)}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return jsonError("Too many requests. Please try again shortly.", 429, {
      code: "rate_limited",
    });
  }
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  const parsed = paymentProofSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid payment proof.", 400);
  }
  const { trxId, receiptUrl } = parsed.data;
  const session = getSessionFromRequest(request);
  try {
    await connectDB();
    let order = await Order.findOne({ orderNo: id });
    if (!order && mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) return jsonError("Order not found.", 404);
    // Signed-in non-owner cannot submit proof for someone else's order.
    // Guests (no session) may submit for the order id they were given.
    if (session && order.userId && String(order.userId) !== session.id && session.role !== "admin") {
      return jsonError("You can only submit payment proof for your own orders.", 403);
    }
    if (order.paymentMethod !== "Advance") {
      return jsonError("This order does not use advance payment.", 400);
    }
    if (order.paymentStatus === "Paid") {
      return jsonError("This order is already paid.", 400);
    }
    if (
      order.paymentWindowExpiresAt &&
      new Date(order.paymentWindowExpiresAt).getTime() < Date.now()
    ) {
      order.status = "Cancelled";
      order.timeline.push({
        status: "Cancelled",
        at: new Date(),
        note: "Payment window expired before the receipt was uploaded.",
      });
      await order.save();
      return jsonError("The 24 hour payment window has passed. This order was cancelled.", 410, {
        code: "payment_window_expired",
      });
    }
    // Duplicate TRX ID on ANY other order: reject before touching this one.
    const dup = await Order.findOne({
      trxId,
      _id: { $ne: order._id },
    })
      .select("_id")
      .lean();
    if (dup) {
      return jsonError("This transaction ID was already used for another order.", 409, {
        code: "duplicate_trx_id",
      });
    }
    order.paymentStatus = "PaymentPending";
    order.trxId = trxId;
    order.receiptUrl = receiptUrl;
    order.receiptUploadedAt = new Date();
    order.timeline.push({
      status: "PaymentPending",
      at: new Date(),
      note: `Payment receipt uploaded (TRX ${trxId}).`,
    });
    await order.save();
    return json({
      order: {
        id: String(order._id),
        orderNo: order.orderNo,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentWindowExpiresAt: order.paymentWindowExpiresAt,
      },
    });
  } catch (err) {
    // A duplicate-key error on the sparse unique trxId index is the same
    // fraud case as the explicit check above (a race between two requests).
    if (err?.code === 11000) {
      return jsonError("This transaction ID was already used for another order.", 409, {
        code: "duplicate_trx_id",
      });
    }
    return dbErrorResponse(err);
  }
}
