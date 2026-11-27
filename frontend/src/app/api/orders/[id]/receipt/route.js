import mongoose from "mongoose";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Order from "@/models/Order";
import { isCloudinaryConfigured, uploadImageBuffer } from "@/lib/cloudinary";
import { json, jsonError, dbNotConfiguredError, dbErrorResponse, sameOriginError } from "@/lib/api-helpers";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Magic-byte check (same rule as /api/upload): the client-supplied MIME
// type is not trusted. Only real JPEG, PNG or WebP files are accepted.
function imageKind(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return "jpeg";
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
    return "png";
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  )
    return "webp";
  return null;
}

// POST /api/orders/[id]/receipt — guest-usable receipt upload for an
// Advance order. The admin-only /api/upload cannot serve guests, and
// the Advance flow is guest-first, so this endpoint is public but
// tightly scoped: it only accepts a receipt for an existing unpaid
// Advance order whose 24-hour window is still open, and it uploads
// straight to Cloudinary under ai-communication/receipts. No auth:
// the order id/orderNo in the URL is the credential, exactly like the
// payment-proof endpoint. multipart/form-data with a "file" field.
// Returns { url }.
export async function POST(request, { params }) {
  const originErr = sameOriginError(request);
  if (originErr) return originErr;
  const rl = rateLimit(`receipt:${clientIp(request)}`, { limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return jsonError("Too many requests. Please try again shortly.", 429, {
      code: "rate_limited",
    });
  }
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
      return jsonError("This order does not use advance payment.", 400);
    }
    if (order.paymentStatus === "Paid") {
      return jsonError("This order is already paid.", 400);
    }
    if (
      order.paymentWindowExpiresAt &&
      new Date(order.paymentWindowExpiresAt).getTime() < Date.now()
    ) {
      order.status = "Cancelled";
      order.timeline.push({
        status: "Cancelled",
        at: new Date(),
        note: "Payment window expired before the receipt was uploaded.",
      });
      await order.save();
      return jsonError("The 24 hour payment window has passed. This order was cancelled.", 410, {
        code: "payment_window_expired",
      });
    }
    if (!isCloudinaryConfigured()) {
      return json(
        {
          error: "upload_not_configured",
          code: "upload_not_configured",
          message:
            "Receipt upload is not configured yet. Try again shortly, or contact us with your order number and TRX ID.",
        },
        503
      );
    }
    let form;
    try {
      form = await request.formData();
    } catch {
      return jsonError("Invalid upload.", 400);
    }
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return jsonError("Choose an image file to upload.", 400);
    }
    if (!file.type?.startsWith("image/")) {
      return jsonError("Only image files are allowed.", 400);
    }
    if (file.size > MAX_BYTES) {
      return jsonError("Image must be 5 MB or smaller.", 400);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!imageKind(buffer)) {
      return jsonError("Only JPEG, PNG or WebP photos are allowed.", 400);
    }
    const url = await uploadImageBuffer(
      buffer,
      file.name || "receipt.jpg",
      "ai-communication/receipts"
    );
    return json({ url }, 201);
  } catch (err) {
    console.error("Receipt upload failed:", err.message);
    return dbErrorResponse(err);
  }
}
