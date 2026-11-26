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
  paymentMethod: z.enum(["COD", "WhatsApp"]).default("COD"),
});

const nullablePrice = z
  .number()
  .int()
  .min(0)
  .nullable()
  .optional()
  .transform((v) => (v === undefined ? null : v));

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

export const productSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().toLowerCase().optional().default(""),
  brand: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1),
  pricePKR: nullablePrice,
  compareAtPricePKR: nullablePrice,
  stock: z.number().int().min(0).default(0),
  images: z.array(z.string().trim().min(1)).max(10).default([]),
  shortDesc: z.string().trim().max(500).default(""),
  specs: z.union([z.string(), z.record(z.union([z.string(), z.number()]))]).optional().transform(parseSpecs),
  features: z.array(z.string().trim()).max(20).default([]),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const productUpdateSchema = productSchema.partial();

export const orderStatusSchema = z.object({
  status: z.enum(["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"]),
});
