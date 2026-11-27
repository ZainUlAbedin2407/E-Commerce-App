// Search matching (audit M4): normalization, synonyms, dash-tolerance
// and typo tolerance. One shared implementation for the MongoDB path,
// the seed path and the search-suggestion box, so "dv1089", "earphone"
// and "speker" all find the right products.
//
// The catalogue is small (tens of products), so matching runs in JS
// over the candidate set. When it grows past a few hundred products,
// move this to Atlas Search.

const SYNONYMS = {
  earphone: "earbud",
  earphones: "earbud",
  earbuds: "earbud",
  handfree: "handsfree",
  handsfrees: "handsfree",
  powerbank: "power bank",
  powerbanks: "power bank",
  smartwatch: "smart watch",
  smartwatches: "smart watch",
};

export function normalizeQuery(q) {
  return (q || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// The normalized query plus synonym variants, e.g. "earphone" also
// searches "earbud".
export function expandQuery(q) {
  const norm = normalizeQuery(q);
  const terms = new Set([norm]);
  for (const [from, to] of Object.entries(SYNONYMS)) {
    if (norm.includes(from)) terms.add(norm.replaceAll(from, to));
    if (norm.includes(to)) terms.add(norm.replaceAll(to, from));
  }
  return [...terms].filter(Boolean);
}

// "dv1089" matches "DV-1089": allow an optional dash/space between chars.
export function dashTolerantRegex(q) {
  const chars = normalizeQuery(q).replace(/\s/g, "");
  if (!chars) return null;
  const pattern = [...chars]
    .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[- ]?");
  return new RegExp(pattern, "i");
}

export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const row = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = tmp;
    }
  }
  return row[n];
}

// Typo tolerance: a query word matches a product word within edit
// distance 1 (queries of 4–5 chars) or 2 (6+ chars). Short queries
// are not fuzzed — "sp" matching "speaker" would be noise.
export function fuzzyMatch(query, text) {
  const q = normalizeQuery(query);
  if (q.length < 4) return false;
  const maxDist = q.length >= 6 ? 2 : 1;
  return normalizeQuery(text)
    .split(" ")
    .some((w) => w.length >= 4 && levenshtein(q, w) <= maxDist);
}

export function productMatchesSearch(product, query) {
  const hay = [
    product.name,
    product.brand,
    product.model,
    product.category,
    product.shortDesc,
    ...(product.specs ? Object.values(product.specs) : []),
  ]
    .filter(Boolean)
    .join(" ");
  const terms = expandQuery(query);
  const normHay = normalizeQuery(hay);
  if (terms.some((t) => normHay.includes(t))) return true;
  const dt = dashTolerantRegex(query);
  if (dt && dt.test(hay)) return true;
  return fuzzyMatch(query, hay);
}
