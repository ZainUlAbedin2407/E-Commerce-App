import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Order from "@/models/Order";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(order) {
  const o = order.toObject ? order.toObject() : order;
  return { ...o, id: String(o._id), _id: undefined };
}

// GET /api/orders/[id] — id may be the Mongo _id or the orderNo (AIC-0001).
// Owner or admin only.
export async function GET(request, { params }) {
  const { user, error } = requireAuth(request);
  if (error) return error;
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { id } = await params;
  try {
    await connectDB();
    let order = await Order.findOne({ orderNo: id });
    if (!order && mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) return jsonError("Order not found.", 404);
    const isOwner = order.userId && String(order.userId) === user.id;
    if (!isOwner && user.role !== "admin") {
      return jsonError("You can only view your own orders.", 403);
    }
    return json({ order: serialize(order) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
