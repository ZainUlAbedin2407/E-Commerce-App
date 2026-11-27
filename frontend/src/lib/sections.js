// Homepage section product resolver (V3).
//
// Pure function: it takes a HomepageSection (plain object, from MongoDB
// or from the seed defaults) and a list of products (plain objects with
// _id, slug, pricePKR, compareAtPricePKR, createdAt, isNew, category,
// specs) plus recent orders for the bestSelling rule, and returns the
// resolved product list. It works with database documents AND with the
// local fallback catalogue, because the homepage must render in dev
// without Atlas.

function toPlain(p) {
  const x = p?.toObject ? p.toObject() : p;
  return x || null;
}

function productKey(p) {
  return String(p._id || p.id || p.slug || "");
}

// A manual productIds entry may be a Mongo ObjectId, its string form,
// or a slug (the seed defaults use slugs). Match on either.
function findProduct(list, ref) {
  const needle = String(ref);
  return (
    list.find((p) => productKey(p) === needle) ||
    list.find((p) => p.slug === needle) ||
    null
  );
}

function specText(p) {
  const parts = [];
  if (p.specs && typeof p.specs === "object") {
    for (const [k, v] of Object.entries(p.specs)) parts.push(`${k} ${v}`);
  }
  if (Array.isArray(p.features)) parts.push(...p.features);
  return parts.join(" ").toLowerCase();
}

function createdMs(p) {
  if (!p.createdAt) return null;
  const ms = new Date(p.createdAt).getTime();
  return Number.isFinite(ms) ? ms : null;
}

// orders: plain order objects {items: [{slug, productId, qty}], createdAt}.
// orderItems (flat): [{slug, productId, qty, at}], accepted for callers
// that already flattened. Returns a Map keyed by product slug/id string.
function unitsSoldByKey(orders, orderItems, windowMs) {
  const cutoff = Date.now() - windowMs;
  const sold = new Map();
  const add = (key, qty, atMs) => {
    if (!key) return;
    if (atMs != null && atMs < cutoff) return;
    sold.set(key, (sold.get(key) || 0) + (Number(qty) || 0));
  };
  for (const o of orders || []) {
    const atMs = o.createdAt ? new Date(o.createdAt).getTime() : null;
    for (const item of o.items || []) {
      add(String(item.slug || item.productId || ""), item.qty, atMs);
      if (item.productId) add(String(item.productId), item.qty, atMs);
    }
  }
  for (const item of orderItems || []) {
    const atMs = item.at ? new Date(item.at).getTime() : null;
    add(String(item.slug || item.productId || ""), item.qty, atMs);
    if (item.productId) add(String(item.productId), item.qty, atMs);
  }
  return sold;
}

export function resolveSectionProducts(section, products, orders = [], orderItems = []) {
  const s = toPlain(section) || {};
  const list = (products || []).map(toPlain).filter(Boolean);
  const rule = s.rule || {};
  const limit = Math.max(1, Number(rule.limit) || 8);
  const windowDays = Math.max(1, Number(rule.windowDays) || 30);
  const windowMs = windowDays * 24 * 60 * 60 * 1000;

  // Manual list, in the admin's order. For rule sections this same list
  // is the manual override (bestSelling puts it first).
  const manual = (s.productIds || [])
    .map((ref) => findProduct(list, ref))
    .filter(Boolean);

  // Non-rule sections (hero, categoryTiles, brandsStrip, trustBadges,
  // reviewsTeaser, or a manual productRow) return the manual list as-is.
  if (s.sourceType !== "rule" || !rule.kind) {
    return manual;
  }

  const cutoff = Date.now() - windowMs;
  let resolved = [];
  if (rule.kind === "new") {
    // Created within windowDays, OR flagged isNew by the admin.
    resolved = list
      .filter((p) => {
        const ms = createdMs(p);
        return p.isNew || (ms != null && ms >= cutoff);
      })
      .sort((a, b) => (createdMs(b) || 0) - (createdMs(a) || 0));
  } else if (rule.kind === "bestSelling") {
    const sold = unitsSoldByKey(orders, orderItems, windowMs);
    const ranked = list
      .map((p) => ({
        p,
        units:
          (sold.get(p.slug) || 0) +
          (sold.get(productKey(p)) || 0),
      }))
      .filter((r) => r.units > 0)
      .sort((a, b) => b.units - a.units || (createdMs(b.p) || 0) - (createdMs(a.p) || 0))
      .map((r) => r.p);
    // Manual override first, then the sales ranking, de-duplicated.
    const seen = new Set(manual.map(productKey));
    resolved = [...manual, ...ranked.filter((p) => !seen.has(productKey(p)))];
    return resolved.slice(0, limit);
  } else if (rule.kind === "category") {
    resolved = list.filter((p) => p.category === rule.category);
  } else if (rule.kind === "onSale") {
    resolved = list.filter(
      (p) => p.compareAtPricePKR != null && p.pricePKR != null && p.compareAtPricePKR > p.pricePKR
    );
  } else if (rule.kind === "tag") {
    const tag = String(rule.tag || "").toLowerCase().trim();
    resolved = tag ? list.filter((p) => specText(p).includes(tag)) : [];
  }
  return resolved.slice(0, limit);
}
