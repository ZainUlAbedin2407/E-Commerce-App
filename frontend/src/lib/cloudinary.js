// Cloudinary image uploads (admin product photos).
//
// No credentials are ever committed. All three env vars must be set, or
// uploads return a clear 503 ("upload_not_configured") and the admin form
// shows that message — a raw image URL is never silently accepted instead.

import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function configure() {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Uploads not configured: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET. See .env.example."
    );
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export function uploadImageBuffer(
  buffer,
  filename = "product.jpg",
  folder = "ai-communication/products"
) {
  configure();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        public_id: undefined,
        filename_override: filename,
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}
