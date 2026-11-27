import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Order from "@/models/Order";
import { adminOrderActionSchema } from "@/lib/validation";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(order) {
  const o = order.toObject ? order.toObject() : order;
  return { ...o, id: String(o._id), _id: undefined };
}

async function findOrder(id) {
  let order = await Order.findOne({ orderNo: id });
  if (!order && mongoose.Types.ObjectId.isValid(id)) {
    order = await Order.findById(id);
  }
  return order;
}

// GET /api/admin/orders/[id]
export async function GET(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const order = await findOrder(id);
    if (!order) return jsonError("Order not found.", 404);
    return json({ order: serialize(order) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

// PATCH /api/admin/orders/[id] — one body, one action:
//   {status} or {action: "status", status} — status change (timeline entry)
//   {action: "note", note} — add an internal note {text, by: admin, at}
//   {action: "verifyPayment"} — paymentStatus Paid, paymentVerifiedAt,
//     status Confirmed, timeline entry
//   {action: "rejectPayment", note?} — paymentStatus Failed, timeline + note
//   {action: "return", returnType, returnNotes?} — RTO / Defective /
//     ChangeOfMind handling
// Stock is decremented at order time (see POST /api/orders), not on
// status change.
export async function PATCH(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { user, error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  const parsed = adminOrderActionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid order action.", 400);
  }
  const data = parsed.data;
  // Backward compatible: a body with only {status} is a status change.
  const action = data.action || (data.status ? "status" : null);
  if (!action) return jsonError("Nothing to do. Send a status, a note, or an action.", 400);
  if (action === "status" && !data.status) {
    return jsonError("Choose a status.", 400);
  }
  if (action === "note" && !data.note) {
    return jsonError("Write the note first.", 400);
  }
  if (action === "return" && !data.returnType) {
    return jsonError("Choose a return type: RTO, Defective, or ChangeOfMind.", 400);
  }
  try {
    await connectDB();
    const order = await findOrder(id);
    if (!order) return jsonError("Order not found.", 404);
    const now = new Date();
    const by = user?.name || user?.email || "admin";
    if (action === "status") {
      order.status = data.status;
      order.timeline.push({ status: data.status, at: now, note: data.note || "" });
    } else if (action === "note") {
      order.notes.push({ text: data.note, by, at: now });
    } else if (action === "verifyPayment") {
      // Only verify after the amount is seen in the bank/wallet
      // statement, matched by amount + TRX ID + date. The screenshot
      // alone is never proof (plan sec 5.2).
      if (order.paymentStatus !== "PaymentPending") {
        return jsonError("This order has no pending payment to verify.", 400);
      }
      order.paymentStatus = "Paid";
      order.paymentVerifiedAt = now;
      order.status = "Confirmed";
      order.timeline.push({
        status: "Confirmed",
        at: now,
        note: `Payment verified (TRX ${order.trxId || "n/a"}).`,
      });
      order.notes.push({ text: "Payment verified against the statement.", by, at: now });
    } else if (action === "rejectPayment") {
      if (order.paymentStatus !== "PaymentPending") {
        return jsonError("This order has no pending payment to reject.", 400);
      }
      order.paymentStatus = "Failed";
      order.timeline.push({
        status: "Failed",
        at: now,
        note: data.note || "Payment receipt rejected.",
      });
      order.notes.push({
        text: data.note || "Payment receipt rejected. Customer asked to pay again.",
        by,
        at: now,
      });
    } else if (action === "return") {
      order.returnType = data.returnType;
      order.returnNotes = data.returnNotes || "";
      order.notes.push({
        text: `Return (${data.returnType}): ${data.returnNotes || "no notes"}`,
        by,
        at: now,
      });
    }
    await order.save();
    return json({ order: serialize(order) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
