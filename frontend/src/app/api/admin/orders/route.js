import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Order from "@/models/Order";
import { json, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/orders — all customer orders, newest first.
// ?search= matches order number, customer name, or phone (digits, with
// an optional dash after the 4th digit). ?status= filters by status.
export async function GET(request) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  const search = (searchParams.get("search") || "").trim();
  const status = (searchParams.get("status") || "").trim();
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const or = [
      { orderNo: { $regex: safe, $options: "i" } },
      { "customer.name": { $regex: safe, $options: "i" } },
    ];
    const digits = search.replace(/\D/g, "");
    if (digits.length >= 4) {
      const phonePattern = `${digits.slice(0, 4)}-?${digits.slice(4)}`;
      or.push({ "customer.phone": { $regex: phonePattern } });
    }
    filter.$or = or;
  }
  try {
    await connectDB();
    const total = await Order.countDocuments(filter);
    const docs = await Order.find(filter)
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
  } catch (err) {
    return dbErrorResponse(err);
  }
}
