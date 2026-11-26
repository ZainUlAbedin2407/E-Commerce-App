import { json, jsonError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { isCloudinaryConfigured, uploadImageBuffer } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// POST /api/upload — admin only. multipart/form-data with a "file" field.
// Image files only, max 5 MB, uploaded to Cloudinary. Returns { url }.
// If Cloudinary is not configured → 503 { error: "upload_not_configured" };
// the admin form shows that message and offers a labelled manual-URL
// fallback instead. A raw URL is never silently accepted as an upload.
export async function POST(request) {
  const { error } = requireAdmin(request);
  if (error) return error;
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
    const url = await uploadImageBuffer(buffer, file.name || "product.jpg");
    return json({ url }, 201);
  } catch (err) {
    console.error("Cloudinary upload failed:", err.message);
    return jsonError("Upload failed. Try again.", 500);
  }
}
