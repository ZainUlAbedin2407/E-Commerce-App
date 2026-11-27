import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Order from "@/models/Order";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(order) {
  const o = order.toObject ? order.toObject() : order;
  return { ...o, id: String(o._id), _id: undefined };
}

// Normalize a Pakistani phone for comparison: strip everything that is
// not a digit, then drop a leading 92 country code, so +92 335 5186552
// matches 0335-5186552.
function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("92")) return digits.slice(2);
  return digits;
}

// GET /api/orders/track?orderNo=&phone= — guest order lookup. No auth
// and no account needed: the order number PLUS the phone used at
// checkout is the credential, exactly like the claim flow. A wrong
// pair returns a vague 404, never a hint about which half was wrong.
// The order document holds no payment account details, so returning
// the serialized order is safe.
export async function GET(request) {
  const rl = rateLimit(`track:${clientIp(request)}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return jsonError("Too many requests. Please try again shortly.", 429, {
      code: "rate_limited",
    });
  }
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { searchParams } = new URL(request.url);
  const orderNo = (searchParams.get("orderNo") || "").trim().toUpperCase();
  const phone = normalizePhone(searchParams.get("phone") || "");
  if (!orderNo || !phone) {
    return jsonError("Order number and phone number are required.", 400);
  }
  try {
    await connectDB();
    const candidates = await Order.find({ orderNo }).lean();
    const order = candidates.find(
      (o) => normalizePhone(o.customer?.phone) === phone
    );
    if (!order) return jsonError("No order matches that order number and phone number.", 404);
    return json({ order: serialize(order) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
