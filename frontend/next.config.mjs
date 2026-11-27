/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Audit H4: admin uploads return res.cloudinary.com URLs and every
    // product image renders through next/image. Without this, a Cloudinary
    // photo breaks the product page, cart, and order views.
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  // Audit H7: security headers on every response. The CSP is a first
  // step — 'unsafe-inline'/'unsafe-eval' are still needed for Next.js's
  // inlined bootstrap scripts; a nonce-based CSP is the P3 hardening.
  // Live headers are verified in the P1 test (curl -I).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
