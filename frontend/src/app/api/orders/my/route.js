import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Order from "@/models/Order";
import { json, dbNotConfiguredError } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/orders/my — the signed-in customer's own orders, newest first.
export async function GET(request) {
  const { user, error } = requireAuth(request);
  if (error) return error;
  if (!isDbConfigured()) return dbNotConfiguredError();
  await connectDB();
  const orders = await Order.find({ userId: new mongoose.Types.ObjectId(user.id) })
    .sort({ createdAt: -1 })
    .lean();
  return json({
    orders: orders.map((o) => ({ ...o, id: String(o._id), _id: undefined })),
  });
}
