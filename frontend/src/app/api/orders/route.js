import { connectDB, isDbConfigured } from "@/lib/mongodb";
import { orderSchema } from "@/lib/validation";
import { createOrder } from "@/lib/order-create";
import {
  json,
  jsonError,
  dbErrorResponse,
  sameOriginError,
} from "@/lib/api-helpers";
import { getSessionFromRequest } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/orders — guest orders allowed (no account needed).
// All pricing, delivery fees, COD rules and stock handling live in
// src/lib/order-create.js (shared with the admin draft-order route).
// Client-supplied prices/totals are NEVER trusted. No DB → 503
// { error: "orders_db_not_configured" }. No fake server order.
//
// Payment (V3, plan sec 5.2): "Advance" or "COD" only. "WhatsApp" is
// gone: there is no WhatsApp ordering any more. Advance orders get a
// 24-hour payment window; the customer pays, then uploads the receipt +
// TRX ID on the order page, and the order stays PaymentPending until
// Zain verifies the amount in his statement. COD stays "Unpaid" until
// delivery. COD is refused server-side above codMaxTotal (Rs 2,000).
// Unpriced products do not go live: an item with a null price fails
// the order with a 400.
export async function POST(request) {
  // Audit M3: state-changing requests must come from our own origin.
  const originErr = sameOriginError(request);
  if (originErr) return originErr;
  // Audit H3: 10 order attempts per minute per IP.
  const rl = rateLimit(`orders:${clientIp(request)}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return jsonError("Too many requests. Please try again shortly.", 429, {
      code: "rate_limited",
    });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  // Validate BEFORE the DB check: a malformed order (bad payment
  // method, bad phone, empty cart) is a 400 even with no database,
  // so the client gets a real answer instead of a misleading 503.
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid order.", 400);
  }
  if (!isDbConfigured()) {
    return json(
      {
        error: "orders_db_not_configured",
        code: "orders_db_not_configured",
        message:
          "Orders are saved on this device until the database is connected.",
      },
      503
    );
  }
  const { customer, items, paymentMethod } = parsed.data;
  const session = getSessionFromRequest(request);
  try {
    await connectDB();
    const { order, error } = await createOrder({
      customer,
      items,
      paymentMethod,
      userId: session?.id || null,
    });
    if (error) {
      return jsonError(error.message, error.status, error.code ? { code: error.code } : {});
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
    // Audit H2: a DB failure is a stable 503, never an uncaught 500.
    if (err?.code === "db_unavailable" || err?.name === "DbUnavailableError") {
      return dbErrorResponse(err);
    }
    console.error("Order failed:", err?.message || err);
    return jsonError("Order could not be placed. Please try again.", 503, {
      code: "order_failed",
    });
  }
}
