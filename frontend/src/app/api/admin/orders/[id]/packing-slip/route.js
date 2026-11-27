import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Order from "@/models/Order";
import { SHOP_NAME, SHOP_ADDRESS } from "@/lib/site";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/orders/[id]/packing-slip — the section 19 receipt data
// (V3 plan sec 4): date, description, quantity, price, seller name and
// address, plus the delivery fee, total, payment method and customer.
// The Wave 2 admin UI prints this as the packing slip / receipt.
export async function GET(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    let order = await Order.findOne({ orderNo: id });
    if (!order && mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) return jsonError("Order not found.", 404);
    return json({
      packingSlip: {
        orderNo: order.orderNo,
        date: order.createdAt,
        seller: { name: SHOP_NAME, address: SHOP_ADDRESS },
        customer: order.customer,
        items: order.items.map((i) => ({
          description: `${i.name}${i.model ? ` (${i.model})` : ""}`,
          quantity: i.qty,
          pricePKR: i.pricePKR,
          lineTotalPKR: i.pricePKR != null ? i.pricePKR * i.qty : null,
        })),
        subtotalPKR: order.subtotalPKR,
        deliveryFeePKR: order.deliveryFeePKR,
        totalPKR: order.totalPKR,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: order.status,
      },
    });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
