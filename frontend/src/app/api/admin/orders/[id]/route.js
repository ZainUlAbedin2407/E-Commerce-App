import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Order from "@/models/Order";
import { orderStatusSchema } from "@/lib/validation";
import { json, jsonError, dbNotConfiguredError } from "@/lib/api-helpers";
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
  const { error } = requireAdmin(request);
  if (error) return error;
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { id } = await params;
  await connectDB();
  const order = await findOrder(id);
  if (!order) return jsonError("Order not found.", 404);
  return json({ order: serialize(order) });
}

// PATCH /api/admin/orders/[id] — status only. Stock is decremented at
// order time (see POST /api/orders), not on status change.
export async function PATCH(request, { params }) {
  const { error } = requireAdmin(request);
  if (error) return error;
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  const parsed = orderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid status.", 400);
  }
  await connectDB();
  const order = await findOrder(id);
  if (!order) return jsonError("Order not found.", 404);
  order.status = parsed.data.status;
  await order.save();
  return json({ order: serialize(order) });
}
