import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";
import { json, dbNotConfiguredError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/stats — admin dashboard numbers.
// totalRevenuePKR is null when no order has a price yet (prices unset).
export async function GET(request) {
  const { error } = requireAdmin(request);
  if (error) return error;
  if (!isDbConfigured()) return dbNotConfiguredError();
  await connectDB();
  const [totalProducts, totalOrders, pendingOrders, totalUsers, revenue] =
    await Promise.all([
      Product.countDocuments({ active: true }),
      Order.countDocuments(),
      Order.countDocuments({ status: "Pending" }),
      User.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: "Cancelled" }, totalPKR: { $ne: null } } },
        { $group: { _id: null, total: { $sum: "$totalPKR" } } },
      ]),
    ]);
  return json({
    totalProducts,
    totalOrders,
    pendingOrders,
    totalUsers,
    totalRevenuePKR: revenue[0]?.total ?? null,
  });
}
