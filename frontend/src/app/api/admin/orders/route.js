import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Order from "@/models/Order";
import { json, dbNotConfiguredError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/orders — all customer orders, newest first.
export async function GET(request) {
  const { error } = requireAdmin(request);
  if (error) return error;
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  await connectDB();
  const total = await Order.countDocuments();
  const docs = await Order.find({})
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return json({
    orders: docs.map((o) => ({ ...o, id: String(o._id), _id: undefined })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}
