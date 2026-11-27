import { z } from "zod";
import { PAK_PHONE } from "./api-helpers";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: z.string().trim().max(20).optional().default(""),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const orderItemSchema = z.object({
  slug: z.string().trim().min(1),
  qty: z.number().int().min(1).max(99),
});

export const orderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2, "Enter your full name."),
    phone: z
      .string()
      .trim()
      .regex(PAK_PHONE, "Enter a valid Pakistani mobile number, e.g. 0335-5186552."),
    address: z.string().trim().min(5, "Enter your full address."),
    city: z.string().trim().min(2, "Enter your city."),
  }),
  items: z.array(orderItemSchema).min(1, "Your cart is empty."),
  paymentMethod: z.enum(["COD", "Advance"]).default("COD"),
});

// Nullable numbers: null = "not set" (price unset, stock untracked).
// There is deliberately NO transform here. Omitted stays undefined, so a
// PATCH can tell "not sent" apart from "explicitly null"; Mongoose
// defaults (null) cover CREATE. Audit C2: stock must accept null exactly
// like price does — the old `.default(0)` rejected explicit null.
const nullableNumber = z.number().int().min(0).nullable().optional();
// Weights are not integers (0.4 kg is a real weight), so they get their
// own nullable number without .int().
const nullableWeight = z.number().min(0).max(100).nullable().optional();

// Specs arrive from the admin form as a JSON string or an object.
// Only plain string/number values are kept.
function parseSpecs(value) {
  if (!value) return {};
  let obj = value;
  if (typeof value === "string") {
    try {
      obj = JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string" || typeof v === "number") out[String(k).slice(0, 60)] = v;
  }
  return out;
}

// A compare-at price only makes sense above the real price (audit L5).
// Both fields are nullable/optional, so the check fires only when both
// are set. NOTE: zod v4 forbids .partial() on an object that already has
// a refinement, so the refine is applied separately to the full schema
// and to the partial (update) schema below — never to the base object.
const compareAtCheck = (p) =>
  p.pricePKR == null ||
  p.compareAtPricePKR == null ||
  p.compareAtPricePKR > p.pricePKR;
const compareAtRefine = {
  message: "Compare-at price must be higher than the price.",
  path: ["compareAtPricePKR"],
};

const productBaseSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().toLowerCase().optional().default(""),
  // V3: canonical brand link. Empty string clears it (becomes null).
  brandId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid brand.")
    .nullable()
    .optional()
    .transform((v) => (v === "" ? null : v)),
  brand: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1),
  pricePKR: nullableNumber,
  compareAtPricePKR: nullableNumber,
  stock: nullableNumber,
  warrantyMonths: z.number().int().min(0).max(12).optional(),
  weightKg: nullableWeight,
  lowStockThreshold: nullableNumber,
  seoTitle: z.string().trim().max(200).optional().default(""),
  seoDescription: z.string().trim().max(500).optional().default(""),
  // Image URLs: https:// (Cloudinary uploads) or a / path (seed images).
  // SVG is rejected — an SVG can carry scripts and is not a product
  // photo. The admin form validates the same rule client-side (audit L6).
  images: z
    .array(z.string().trim().min(1))
    .max(10)
    .default([])
    .refine(
      (urls) =>
        urls.every((u) => {
          if (u.startsWith("/")) return !/\.svg(\?|#|$)/i.test(u);
          if (u.startsWith("https://")) return !/\.svg(\?|#|$)/i.test(u);
          return false;
        }),
      { message: "Image URLs must be https:// (or a / path) and not SVG." }
    ),
  shortDesc: z.string().trim().max(500).default(""),
  specs: z.union([z.string(), z.record(z.union([z.string(), z.number()]))]).optional().transform(parseSpecs),
  features: z.array(z.string().trim()).max(20).default([]),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const productSchema = productBaseSchema.refine(compareAtCheck, compareAtRefine);

// A PATCH that sets only one of the two is checked against the existing
// product in the PATCH handler (its effective-value check).
export const productUpdateSchema = productBaseSchema
  .partial()
  .refine(compareAtCheck, compareAtRefine);

export const orderStatusSchema = z.object({
  status: z.enum(["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"]),
});

// --- V3 schemas ---

const objectIdString = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid id.");

export const brandSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().toLowerCase().min(1).max(100).optional(),
  logo: z.string().trim().max(500).optional().default(""),
  description: z.string().trim().max(1000).optional().default(""),
  active: z.boolean().optional().default(true),
});
export const brandUpdateSchema = brandSchema.partial();

const sectionRuleSchema = z.object({
  kind: z.enum(["new", "bestSelling", "category", "onSale", "tag"]).optional(),
  category: z.string().trim().max(100).optional().default(""),
  tag: z.string().trim().max(100).optional().default(""),
  windowDays: z.number().int().min(1).max(365).optional().default(30),
  limit: z.number().int().min(1).max(50).optional().default(8),
});

export const homepageSectionSchema = z.object({
  type: z.enum(["hero", "banner", "categoryTiles", "productRow", "brandsStrip", "trustBadges", "reviewsTeaser"]),
  title: z.string().trim().max(200).optional().default(""),
  visible: z.boolean().optional().default(true),
  order: z.number().int().min(0).max(100).optional().default(0),
  sourceType: z.enum(["manual", "rule"]).optional().default("manual"),
  // Product ids (ObjectId strings) or slugs for manual lists.
  productIds: z.array(z.string().trim().min(1)).max(50).optional().default([]),
  rule: sectionRuleSchema.optional().default({}),
});
export const homepageSectionUpdateSchema = homepageSectionSchema.partial();

export const filterDefinitionSchema = z.object({
  key: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1).max(100),
  type: z.enum(["list", "range", "boolean"]),
  source: z.string().trim().min(1).max(100),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).max(100).optional().default(0),
});
export const filterDefinitionUpdateSchema = filterDefinitionSchema.partial();

// Category IS the Collection model (see src/models/Category.js).
export const collectionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().toLowerCase().min(1).max(100).optional(),
  blurb: z.string().trim().max(500).optional().default(""),
  image: z.string().trim().max(500).optional().default(""),
  sortOrder: z.number().int().min(0).max(100).optional().default(0),
  active: z.boolean().optional().default(true),
  type: z.enum(["manual", "rule"]).optional().default("manual"),
  products: z.array(z.string().trim().min(1)).max(100).optional().default([]),
  rule: z
    .object({
      kind: z.enum(["category", "brand", "tag", "onSale", "new"]).optional(),
      brand: z.string().trim().max(100).optional().default(""),
      tag: z.string().trim().max(100).optional().default(""),
      windowDays: z.number().int().min(1).max(365).optional().default(30),
      limit: z.number().int().min(1).max(100).optional().default(24),
    })
    .optional()
    .default({}),
  seoTitle: z.string().trim().max(200).optional().default(""),
  seoDescription: z.string().trim().max(500).optional().default(""),
});
export const collectionUpdateSchema = collectionSchema.partial();

// Public review submit: orderNo + phone are checked against a Delivered
// order; a match auto-verifies and auto-publishes, otherwise pending.
export const reviewSubmitSchema = z.object({
  productSlug: z.string().trim().min(1),
  orderNo: z.string().trim().max(20).optional().default(""),
  phone: z
    .string()
    .trim()
    .regex(PAK_PHONE, "Enter a valid Pakistani mobile number, e.g. 0335-5186552."),
  name: z.string().trim().min(2, "Enter your name.").max(100),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(200).optional().default(""),
  body: z.string().trim().min(2, "Write a few words about the product.").max(2000),
});

// Admin adds a WhatsApp/social review by hand. The form states
// explicitly that the admin confirms the buyer, so verified is true and
// the review is approved at once.
export const reviewAdminAddSchema = z.object({
  productSlug: z.string().trim().min(1),
  name: z.string().trim().min(2).max(100),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(200).optional().default(""),
  body: z.string().trim().min(2).max(2000),
  source: z.enum(["whatsapp", "social"]),
});

export const reviewPatchSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  adminReply: z.string().trim().max(2000).optional(),
  verified: z.boolean().optional(),
});

// Payment proof upload (receipt screenshot + TRX ID) for an Advance order.
export const paymentProofSchema = z.object({
  trxId: z.string().trim().min(3, "Enter the transaction ID.").max(100),
  receiptUrl: z
    .string()
    .trim()
    .min(1, "Upload the payment receipt first.")
    .refine(
      (u) => u.startsWith("/") || u.startsWith("https://"),
      "Receipt must be an uploaded image URL."
    ),
});

// Settings: full shape for validation, partial for PATCH. paymentAccounts
// are all optional strings and EMPTY by default; Zain fills them in admin.
const settingsShape = {
  shopName: z.string().trim().min(1).max(100).optional(),
  tagline: z.string().trim().max(200).optional(),
  address: z.string().trim().max(300).optional(),
  whatsappNumber: z.string().trim().max(20).optional(),
  socials: z
    .object({
      instagram: z.string().trim().max(300).optional(),
      facebook: z.string().trim().max(300).optional(),
      tiktok: z.string().trim().max(300).optional(),
      whatsappCommunity: z.string().trim().max(300).optional(),
    })
    .partial()
    .optional(),
  logoUrl: z.string().trim().max(500).optional(),
  bannerUrl: z.string().trim().max(500).optional(),
  announcement: z
    .object({
      text: z.string().trim().max(300).optional(),
      link: z.string().trim().max(500).optional(),
      active: z.boolean().optional(),
      startDate: z.string().trim().nullable().optional(),
      endDate: z.string().trim().nullable().optional(),
    })
    .partial()
    .optional(),
  delivery: z
    .object({
      karachiFee: z.number().min(0).optional(),
      otherFee: z.number().min(0).optional(),
      freeUpToKg: z.number().min(0).optional(),
      extraKgFee: z.number().min(0).optional(),
      freeShippingThreshold: z.number().min(0).nullable().optional(),
    })
    .partial()
    .optional(),
  codMaxTotal: z.number().min(0).optional(),
  paymentAccounts: z
    .object({
      bankName: z.string().trim().max(200).optional(),
      accountTitle: z.string().trim().max(200).optional(),
      accountNumber: z.string().trim().max(100).optional(),
      iban: z.string().trim().max(100).optional(),
      jazzcashNumber: z.string().trim().max(20).optional(),
      easypaisaNumber: z.string().trim().max(20).optional(),
      raastQrUrl: z.string().trim().max(500).optional(),
    })
    .partial()
    .optional(),
  paymentMethods: z
    .array(
      z.object({
        key: z.string().trim().min(1),
        label: z.string().trim().min(1),
        enabled: z.boolean(),
      })
    )
    .optional(),
  reviewRequestDays: z.number().int().min(0).max(30).optional(),
};
export const settingsSchema = z.object(settingsShape);
export const settingsUpdateSchema = z.object(settingsShape);

// Admin order actions. `action` defaults to "status" when only a status
// is sent, so the old PATCH shape keeps working. Each action appends a
// timeline entry; notes record who did what and when.
export const adminOrderActionSchema = z.object({
  action: z.enum(["status", "note", "verifyPayment", "rejectPayment", "return"]).optional(),
  status: z.enum(["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"]).optional(),
  note: z.string().trim().min(1).max(1000).optional(),
  returnType: z.enum(["RTO", "Defective", "ChangeOfMind"]).optional(),
  returnNotes: z.string().trim().max(1000).optional(),
});

// Admin draft order: an order created on behalf of a phone/WhatsApp
// customer, priced and stocked exactly like a public order.
export const draftOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2, "Enter the customer name."),
    phone: z
      .string()
      .trim()
      .regex(PAK_PHONE, "Enter a valid Pakistani mobile number, e.g. 0335-5186552."),
    address: z.string().trim().min(5, "Enter the full address."),
    city: z.string().trim().min(2, "Enter the city."),
  }),
  items: z.array(orderItemSchema).min(1, "Add at least one item."),
  paymentMethod: z.enum(["COD", "Advance"]).default("COD"),
  status: z.enum(["Pending", "Confirmed"]).optional().default("Pending"),
});

export { objectIdString };
