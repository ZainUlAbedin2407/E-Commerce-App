// In-memory per-IP sliding-window rate limiter (audit H3).
//
// First layer only, and the comment is the honesty: Vercel serverless
// functions are ephemeral, so a bucket lives only as long as one warm
// instance — this stops casual brute-force / order spam from a single IP
// hitting one instance, it does not stop a distributed attack. The
// production upgrade is Upstash Ratelimit or Vercel WAF (Pro plan).
// The limits below are per IP per route group.

const buckets = new Map(); // key -> { count, resetAt }
const MAX_BUCKETS = 5000;

export function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  // Opportunistic pruning so the map cannot grow without bound.
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (now >= b.resetAt) buckets.delete(k);
      if (buckets.size <= MAX_BUCKETS) break;
    }
  }
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}
