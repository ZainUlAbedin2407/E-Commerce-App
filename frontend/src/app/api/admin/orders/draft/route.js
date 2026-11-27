import { connectDB, isDbConfigured } from "@/lib/mongodb";
import { draftOrderSchema } from "@/lib/validation";
import { createOrder } from "@/lib/order-create";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/orders/draft — the owner creates an order on behalf of
// a customer who phoned or messaged (plan sec 7.1). Body: {customer,
// items by slug and qty, paymentMethod, status "Pending"}. Pricing,
// delivery fee, COD rules, stock decrement and the order number come
// from the SAME server-side logic as the public orders route
// (src/lib/order-create.js), so a draft can never be priced differently
// from a website order.
export async function POST(request) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  const parsed = draftOrderSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid draft order.", 400);
  }
  const { customer, items, paymentMethod, status } = parsed.data;
  try {
    await connectDB();
    const { order, error: orderError } = await createOrder({
      customer,
      items,
      paymentMethod,
      status,
      userId: null,
    });
    if (orderError) {
      return jsonError(
        orderError.message,
        orderError.status,
        orderError.code ? { code: orderError.code } : {}
      );
    }
    return json(
      {
        order: {
          id: String(order._id),
          orderNo: order.orderNo,
          status: order.status,
          subtotalPKR: order.subtotalPKR,
          deliveryFeePKR: order.deliveryFeePKR,
          totalPKR: order.totalPKR,
          items: order.items,
          customer: order.customer,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          paymentWindowExpiresAt: order.paymentWindowExpiresAt,
          createdAt: order.createdAt,
        },
      },
      201
    );
  } catch (err) {
    if (err?.code === "db_unavailable" || err?.name === "DbUnavailableError") {
      return dbErrorResponse(err);
    }
    console.error("Draft order failed:", err?.message || err);
    return jsonError("Draft order could not be placed. Please try again.", 503, {
      code: "order_failed",
    });
  }
}
