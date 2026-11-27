import { getPublicSettings, DbUnavailableError } from "@/lib/catalog";
import { json, dbErrorResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/settings/public — the safe public subset of Settings.
// Returns announcement, delivery, codMaxTotal, paymentMethods (key/label/
// enabled only), socials, shopName, tagline, address, whatsappNumber,
// logoUrl, bannerUrl. paymentAccounts are NEVER returned here: the bank
// and wallet details are shown only after an order is placed, on the
// order page (V3 plan sec 5.2).
export async function GET() {
  try {
    const s = await getPublicSettings();
    return json({
      shopName: s.shopName,
      tagline: s.tagline,
      address: s.address,
      whatsappNumber: s.whatsappNumber,
      socials: s.socials,
      logoUrl: s.logoUrl,
      bannerUrl: s.bannerUrl,
      announcement: s.announcement,
      delivery: s.delivery,
      codMaxTotal: s.codMaxTotal,
      paymentMethods: (s.paymentMethods || []).map((m) => ({
        key: m.key,
        label: m.label,
        enabled: Boolean(m.enabled),
      })),
    });
  } catch (err) {
    if (err instanceof DbUnavailableError || err?.code === "db_unavailable") {
      return dbErrorResponse(err);
    }
    throw err;
  }
}
