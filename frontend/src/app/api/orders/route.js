import { connectDB, isDbConfigured } from "@/lib/mongodb";
import Order from "@/models/Order";
import { getDbProductBySlug } from "@/lib/catalog";
import { orderSchema } from "@/lib/validation";
import {
  json,
  jsonError,
  whatsappLinkForOrder,
} from "@/lib/api-helpers";
import { getSessionFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/orders — guest COD orders allowed (no account needed).
// Server-side pricing: products are re-read from MongoDB and the totals
// are computed here. Client-supplied prices/totals are NEVER trusted.
// Stock is decremented only when the DB product exists and has tracked
// stock (stock is a number). Seed products have stock null = untracked.
// No DB → 503 { error: "orders_db_not_configured" } and the client keeps
// its Phase 1 localStorage order + WhatsApp flow. No fake server order.
export async function POST(request) {
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
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid order.", 400);
  }
  const { customer, items, paymentMethod } = parsed.data;
  const session = getSessionFromRequest(request);

  await connectDB();
  const orderItems = [];
  let subtotal = 0;
  let allPriced = true;

  for (const { slug, qty } of items) {
    const doc = await getDbProductBySlug(slug);
    if (!doc) {
      return jsonError(`Product is no longer available: ${slug}.`, 400);
    }
    if (typeof doc.stock === "number") {
      if (doc.stock < qty) {
        return jsonError(`Out of stock: ${doc.name}.`, 400);
      }
      doc.stock -= qty;
      await doc.save();
    }
    if (doc.pricePKR == null) {
      allPriced = false;
    } else {
      subtotal += doc.pricePKR * qty;
    }
    orderItems.push({
      productId: doc._id,
      slug: doc.slug,
      name: doc.name,
      model: doc.model,
      image: doc.images?.[0] || "",
      pricePKR: doc.pricePKR ?? null,
      qty,
    });
  }

  const count = await Order.countDocuments();
  const orderNo = `AIC-${String(count + 1).padStart(4, "0")}`;

  const order = await Order.create({
    orderNo,
    userId: session?.id || null,
    items: orderItems,
    subtotalPKR: allPriced ? subtotal : null,
    deliveryFeePKR: null,
    totalPKR: allPriced ? subtotal : null,
    customer,
    paymentMethod,
    status: "Pending",
  });

  return json(
    {
      order: {
        id: String(order._id),
        orderNo: order.orderNo,
        status: order.status,
        totalPKR: order.totalPKR,
        items: order.items,
        customer: order.customer,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
      },
      whatsappUrl: whatsappLinkForOrder(order),
    },
    201
  );
}
