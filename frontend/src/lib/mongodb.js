// MongoDB connection — cached singleton for Next.js serverless functions.
//
// Why a cache: on Vercel every API call runs in a short-lived serverless
// function. Opening a fresh Mongoose connection per request would quickly
// exhaust the Atlas M0 free tier's 100-connection limit. The global cache
// reuses one connection across invocations of the same warm function.
//
// Graceful fallback: if MONGODB_URI is not set, nothing here throws at
// import/build time. connectDB() throws a clear "Database not configured"
// error ONLY when a DB route is actually called, and the shop falls back to
// the Phase 1 seed catalogue (src/lib/products.js) so the site still builds
// and previews with no env vars at all.

import mongoose from "mongoose";

export function isDbConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

let cached = globalThis.__aiMongoose;
if (!cached) {
  cached = globalThis.__aiMongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Database not configured: set MONGODB_URI in .env.local (local) or in Vercel → Settings → Environment Variables (production). See .env.example."
    );
  }
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        maxPoolSize: 10,
        // Audit H8: the driver default waits up to 30s on a hung Atlas
        // endpoint. Fail fast so a cold start stalls for seconds, not 30s.
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 30000,
      })
      .then((m) => m);
    // A failed connect must not poison the cache: clear the rejected
    // promise so the next request retries instead of re-throwing forever.
    cached.promise.catch(() => {
      cached.promise = null;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
