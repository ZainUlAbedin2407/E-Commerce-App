import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Order from "@/models/Order";
import Settings from "@/models/Settings";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/orders/[id]/payment-details — payment instructions for an
// Advance order (bank account, JazzCash, Easypaisa, Raast QR) plus the
// total and the 24-hour payment window. No auth: the order id/orderNo
// in the URL is the credential (same pattern as the payment-proof
// endpoint and the order-confirmation page). Account details are shown
// ONLY to someone who already placed this order, never on a public
// page. If Zain has not filled the accounts in admin settings yet,
// the fields come back empty and the order page must say so plainly
// instead of inventing account details.
export async function GET(request, { params }) {
  if (!isDbConfigured()) return dbNotConfiguredError();
  const { id } = await params;
  try {
    await connectDB();
    let order = await Order.findOne({ orderNo: id });
    if (!order && mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) return jsonError("Order not found.", 404);
    if (order.paymentMethod !== "Advance") {
      return jsonError("This order is not an advance payment order.", 400);
    }
    if (order.paymentStatus === "Paid") {
      return jsonError("This order is already paid.", 400);
    }
    const settings = await Settings.findOne({}).lean();
    const accounts = settings?.paymentAccounts || {};
    return json({
      orderNo: order.orderNo,
      totalPKR: order.totalPKR,
      paymentStatus: order.paymentStatus,
      paymentWindowExpiresAt: order.paymentWindowExpiresAt,
      accounts: {
        bankName: accounts.bankName || "",
        accountTitle: accounts.accountTitle || "",
        accountNumber: accounts.accountNumber || "",
        iban: accounts.iban || "",
        jazzcashNumber: accounts.jazzcashNumber || "",
        easypaisaNumber: accounts.easypaisaNumber || "",
        raastQrUrl: accounts.raastQrUrl || "",
      },
    });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
