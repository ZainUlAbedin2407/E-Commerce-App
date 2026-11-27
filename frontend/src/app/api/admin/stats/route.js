import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";
import Review from "@/models/Review";
import { json, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/stats?from=&to= — admin dashboard numbers.
// totalRevenuePKR is null when no order has a price yet (prices unset).
// revenue is the sum of totalPKR for Paid or Delivered orders in the
// requested range (default: all time). lowStock counts products whose
// stock is 0, or at/below their per-product lowStockThreshold.
export async function GET(request) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const range = {};
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) range.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) range.$lte = d;
  }
  const hasRange = Object.keys(range).length > 0;
  try {
    await connectDB();
    const revenueMatch = {
      status: { $ne: "Cancelled" },
      totalPKR: { $ne: null },
    };
    // Revenue counts Paid orders, plus Delivered COD orders (cash was
    // collected at the door). Paid already covers Delivered advance
    // orders, so the union is: Paid OR (Delivered AND COD).
    const revenueOr = [
      { paymentStatus: "Paid" },
      { status: "Delivered", paymentMethod: "COD" },
    ];
    if (hasRange) {
      revenueMatch.createdAt = range;
    }
    const [
      totalProducts,
      totalOrders,
      pendingOrders,
      totalUsers,
      revenue,
      pendingReviews,
      lowStockProducts,
      unfulfilled,
    ] = await Promise.all([
      Product.countDocuments({ active: true }),
      Order.countDocuments(),
      Order.countDocuments({ status: "Pending" }),
      User.countDocuments(),
      Order.aggregate([
        { $match: { ...revenueMatch, $or: revenueOr } },
        { $group: { _id: null, total: { $sum: "$totalPKR" } } },
      ]),
      Review.countDocuments({ status: "pending" }),
      Product.find({
        active: true,
        $or: [
          { stock: 0 },
          {
            $expr: {
              $and: [
                { $ne: ["$stock", null] },
                { $ne: ["$lowStockThreshold", null] },
                { $lte: ["$stock", "$lowStockThreshold"] },
              ],
            },
          },
        ],
      })
        .select("slug name stock lowStockThreshold")
        .lean(),
      Order.countDocuments({ status: { $nin: ["Delivered", "Cancelled"] } }),
    ]);
    return json({
      totalProducts,
      totalOrders,
      pendingOrders,
      totalUsers,
      totalRevenuePKR: revenue[0]?.total ?? null,
      pendingReviews,
      lowStock: lowStockProducts.length,
      lowStockProducts,
      unfulfilled,
      revenue: revenue[0]?.total ?? null,
      range: hasRange ? { from: from || null, to: to || null } : null,
    });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
