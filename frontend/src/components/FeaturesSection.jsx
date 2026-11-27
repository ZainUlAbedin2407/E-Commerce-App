import Link from "next/link";
import {
  SHOP_ADDRESS,
  DELIVERY_KARACHI_PKR,
  DELIVERY_OTHER_PKR,
  DELIVERY_EXTRA_KG_PKR,
  COD_MAX_TOTAL_PKR,
} from "@/lib/site";
import { formatPrice } from "@/lib/products";

// Trust strip: real facts only, in one place. Saddar shop address,
// the real delivery table, checking warranty, COD up to Rs 2,000.
// This is a delivery table plus two short lines, not a grid of
// identical icon cards.
export default function FeaturesSection() {
  return (
    <section className="border-t border-line bg-surface px-5 py-12 md:px-12">
      <h2 className="font-display text-3xl font-bold text-ink">
        Buy it from the shop in Saddar
      </h2>
      <p className="mt-3 max-w-[66ch] text-muted">
        AI Communication sits in {SHOP_ADDRESS}. Every product is tested
        and checked before dispatch, and every product carries a checking
        warranty. Some items carry a 3 or 6 month warranty, with home pickup
        and a repaired return to your doorstep.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-display text-xl font-bold text-ink">
            Delivery charges
          </h3>
          <table className="w-full text-left text-sm">
            <tbody>
              <tr className="border-b border-line">
                <td className="py-2 text-muted">Karachi, up to 1 kg</td>
                <td className="py-2 text-right font-semibold text-ink">
                  {formatPrice(DELIVERY_KARACHI_PKR)}
                </td>
              </tr>
              <tr className="border-b border-line">
                <td className="py-2 text-muted">Rest of Pakistan, up to 1 kg</td>
                <td className="py-2 text-right font-semibold text-ink">
                  {formatPrice(DELIVERY_OTHER_PKR)}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-muted">Each additional kg</td>
                <td className="py-2 text-right font-semibold text-ink">
                  +{formatPrice(DELIVERY_EXTRA_KG_PKR)}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-sm text-muted">
            COD is available for orders up to {formatPrice(COD_MAX_TOTAL_PKR)}.
            Above that, orders are paid 100 percent in advance on the website.
          </p>
        </div>
        <div>
          <h3 className="mb-3 font-display text-xl font-bold text-ink">
            Returns and warranty
          </h3>
          <p className="text-sm text-muted">
            Check your parcel at once when it arrives. If it does not work,
            is damaged, or is not what you ordered, contact us with your order
            number and a short video or photo of the issue. We look into it
            case by case and offer a repair or replacement where the fault is
            ours.
          </p>
          <Link
            href="/returns"
            className="mt-4 inline-flex min-h-12 items-center rounded-full border border-ink/60 px-6 py-3 font-semibold text-ink hover:border-ink"
          >
            Read the returns policy
          </Link>
        </div>
      </div>
    </section>
  );
}
