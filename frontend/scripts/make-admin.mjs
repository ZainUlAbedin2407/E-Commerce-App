// Promote a registered user to admin (first admin setup).
// There is deliberately NO default admin account and NO password in code.
// Flow: register on the site as a normal customer first, then run:
//
//   MONGODB_URI="mongodb+srv://..." node scripts/make-admin.mjs you@example.com
//   — or: node --env-file=.env.local scripts/make-admin.mjs you@example.com
//
// After this, sign in with that account and /admin unlocks.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/make-admin.mjs you@example.com");
  process.exit(1);
}
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Put it in .env.local (see .env.example).");
  process.exit(1);
}

const { default: User } = await import("../src/models/User.js");
await mongoose.connect(uri, { bufferCommands: false, maxPoolSize: 10 });
const user = await User.findOneAndUpdate(
  { email },
  { $set: { role: "admin" } },
  { new: true }
);
await mongoose.disconnect();
if (!user) {
  console.error(`No account found for ${email}. Register on the site first, then re-run this.`);
  process.exit(1);
}
console.log(`${user.email} is now an admin. Sign in and open /admin.`);
