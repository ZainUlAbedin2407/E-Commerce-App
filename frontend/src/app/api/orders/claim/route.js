import Order from "@/models/Order";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(order) {
  const o = order.toObject ? order.toObject() : order;
  return { ...o, id: String(o._id), _id: undefined };
}

// POST /api/orders/claim — attach a guest order to the signed-in account
// (audit L4). The placer proves ownership with the order number AND the
// phone number they ordered with. Guest orders are the ones with
// userId null; an order already on an account cannot be claimed.
// The error is deliberately vague — it must not reveal whether an order
// number exists or which phone it belongs to. Rate-limited (5/min/IP)
// because order numbers are sequential (AIC-0001, …) and guessable.
export async function POST(request) {
  const { user, error } = requireAuth(request);
  if (error) return error;
  if (!isDbConfigured()) return dbNotConfiguredError();
  const rl = rateLimit(`claim:${clientIp(request)}`, { limit: 5, windowMs: 60_000 });
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
  const orderNo = String(body?.orderNo || "").trim().toUpperCase();
  const phone = String(body?.phone || "").replace(/[\s-]/g, "");
  if (!orderNo || !phone) {
    return jsonError("Enter the order number and the phone number you ordered with.", 400);
  }
  try {
    await connectDB();
    const order = await Order.findOne({ orderNo, userId: null });
    if (!order || String(order.customer?.phone || "").replace(/[\s-]/g, "") !== phone) {
      return jsonError(
        "No guest order matches that order number and phone number. Check both and try again, or ask us on WhatsApp.",
        404
      );
    }
    order.userId = user.id;
    await order.save();
    return json({ order: serialize(order) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
