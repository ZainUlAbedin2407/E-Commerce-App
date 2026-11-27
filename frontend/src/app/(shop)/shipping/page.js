import Link from "next/link";
import {
  DELIVERY_KARACHI_PKR,
  DELIVERY_OTHER_PKR,
  DELIVERY_EXTRA_KG_PKR,
  COD_MAX_TOTAL_PKR,
  SHOP_ADDRESS,
} from "@/lib/site";
import { formatPrice } from "@/lib/products";

export const metadata = {
  title: "Shipping, AI Communication",
  description:
    "Delivery charges and payment rules at AI Communication: Karachi Rs 250, rest of Pakistan Rs 300 up to 1 kg, plus Rs 70 per extra kg. COD up to Rs 2,000.",
};

// Real fees only. No courier names, no dispatch days, no delivery day
// counts are invented here, because none were given.
export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-12">
      <h1 className="font-display text-3xl font-bold text-ink">Shipping</h1>
      <p className="mt-2 text-muted">
        Orders are dispatched from {SHOP_ADDRESS}, after payment confirmation,
        and delivered across Pakistan.
      </p>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl font-bold text-ink">Delivery charges</h2>
        <table className="w-full rounded-2xl border border-line bg-surface text-left text-sm">
          <tbody>
            <tr className="border-b border-line">
              <td className="px-5 py-3 text-muted">Karachi, up to 1 kg</td>
              <td className="px-5 py-3 text-right font-semibold text-ink">{formatPrice(DELIVERY_KARACHI_PKR)}</td>
            </tr>
            <tr className="border-b border-line">
              <td className="px-5 py-3 text-muted">Rest of Pakistan, up to 1 kg</td>
              <td className="px-5 py-3 text-right font-semibold text-ink">{formatPrice(DELIVERY_OTHER_PKR)}</td>
            </tr>
            <tr>
              <td className="px-5 py-3 text-muted">Each additional kg</td>
              <td className="px-5 py-3 text-right font-semibold text-ink">+{formatPrice(DELIVERY_EXTRA_KG_PKR)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-sm text-muted">
          The fee is computed from your city and the weight of your order, and
          shown at checkout before you pay. It is also shown on every product
          page and in the cart.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">Payment and dispatch</h2>
        <p className="text-muted">
          Cash on Delivery is available for orders up to {formatPrice(COD_MAX_TOTAL_PKR)}.
          Above that, orders are paid 100 percent in advance on the website,
          by bank transfer, JazzCash, Easypaisa or Raast. Advance orders are
          dispatched after we verify the amount in our own statement. An
          advance order that is not paid within 24 hours is cancelled
          automatically.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">Check your parcel</h2>
        <p className="text-muted">
          Check your parcel at once when it arrives. If it does not work, is
          damaged, or is not what you ordered, contact us with your order
          number and a short video or photo. See{" "}
          <Link href="/returns" className="font-semibold text-battery">Returns and Warranty</Link>.
        </p>
      </section>
    </div>
  );
}
