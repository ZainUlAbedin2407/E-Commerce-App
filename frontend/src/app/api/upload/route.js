import { json, jsonError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { isCloudinaryConfigured, uploadImageBuffer } from "@/lib/cloudinary";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Magic-byte check (audit L7): the client-supplied MIME type is not
// trusted. Only real JPEG, PNG or WebP files are accepted — an SVG (or a
// script renamed .jpg) is rejected before it reaches Cloudinary.
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

// POST /api/upload — admin only. multipart/form-data with a "file" field.
// Image files only, max 5 MB, uploaded to Cloudinary. Returns { url }.
// If Cloudinary is not configured → 503 { error: "upload_not_configured" };
// the admin form shows that message and offers a labelled manual-URL
// fallback instead. A raw URL is never silently accepted as an upload.
export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  // Audit H3: 20 uploads per minute per IP (admin only, but still bounded).
  const rl = rateLimit(`upload:${clientIp(request)}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return jsonError("Too many requests. Please try again shortly.", 429, {
      code: "rate_limited",
    });
  }
  if (!isCloudinaryConfigured()) {
    return json(
      {
        error: "upload_not_configured",
        code: "upload_not_configured",
        message:
          "Photo upload is not configured yet. Set the Cloudinary env vars (see .env.example) or paste an image URL in the form instead.",
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
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!imageKind(buffer)) {
      return jsonError("Only JPEG, PNG or WebP photos are allowed.", 400);
    }
    const url = await uploadImageBuffer(buffer, file.name || "product.jpg");
    return json({ url }, 201);
  } catch (err) {
    console.error("Cloudinary upload failed:", err.message);
    return jsonError("Upload failed. Try again.", 500);
  }
}
