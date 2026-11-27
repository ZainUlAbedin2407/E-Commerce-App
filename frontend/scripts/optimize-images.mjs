// Optimize the product photos + banner in place (same paths, so no
// database migration is needed — the live DB references these exact
// URLs). Photographic PNGs are re-encoded lossy at quality 80 (palette);
// JPGs are re-encoded with mozjpeg at quality 78. Only files over
// 400 KB are touched, and a file is only replaced when the result is
// smaller. Run: node scripts/optimize-images.mjs
// Originals are recoverable from git (frontend/public/ is tracked).
import sharp from "sharp";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const DIRS = ["public/products", "public"];
const MIN_BYTES = 400 * 1024;

async function optimize(file) {
  const s = await stat(file);
  if (s.size <= MIN_BYTES) return null;
  const img = sharp(file);
  const meta = await img.metadata();
  let pipeline = img;
  if (file.endsWith(".png")) {
    // Photographic PNG (a product photo saved as PNG): lossy palette
    // compression. Quality 80 keeps the photo clean and cuts ~70%.
    pipeline = img.png({ quality: 80, compressionLevel: 9, palette: true });
  } else if (file.endsWith(".jpg") || file.endsWith(".jpeg")) {
    pipeline = img.jpeg({ quality: 78, mozjpeg: true });
  } else {
    return null;
  }
  const out = await pipeline.toBuffer();
  if (out.length >= s.size) {
    return { file, before: s.size, after: s.size, skipped: "no gain" };
  }
  const { writeFile } = await import("node:fs/promises");
  await writeFile(file, out);
  return { file, before: s.size, after: out.length, skipped: null, w: meta.width, h: meta.height };
}

const results = [];
for (const dir of DIRS) {
  for (const name of await readdir(dir)) {
    if (!/\.(png|jpe?g)$/i.test(name)) continue;
    const file = join(dir, name);
    const r = await optimize(file);
    if (r) results.push(r);
  }
}
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
for (const r of results) {
  if (r.skipped) {
    console.log(`SKIP ${r.file}: ${kb(r.before)} (${r.skipped})`);
  } else {
    console.log(
      `${r.file}: ${kb(r.before)} -> ${kb(r.after)} (-${Math.round((1 - r.after / r.before) * 100)}%) ${r.w}x${r.h}`
    );
  }
}
const saved = results.reduce((s, r) => s + (r.before - r.after), 0);
console.log(`Total saved: ${kb(saved)}`);
