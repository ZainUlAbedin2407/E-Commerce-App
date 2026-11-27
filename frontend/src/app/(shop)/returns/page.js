import { SHOP_ADDRESS, WHATSAPP_NUMBER, whatsappLink } from "@/lib/site";

export const metadata = {
  title: "Returns and Warranty, AI Communication | Saddar, Karachi",
  description:
    "AI Communication returns and warranty policy: checking warranty on every product, 3 or 6 months warranty on selected items, pickup and repair across Pakistan. WhatsApp 0335-5186552.",
};

// Policy from Zain's answers of 2026-11-26. The 7-day checking window
// was a proposal and is NOT published here until he confirms it, the
// page says "check at once" instead. No refund is promised: the model
// is repair or replacement where the fault is ours.
export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-12">
      <h1 className="mb-2 font-display text-3xl font-bold text-ink">
        Returns and Warranty
      </h1>
      <p className="mb-8 text-muted">
        AI Communication, {SHOP_ADDRESS}. WhatsApp {WHATSAPP_NUMBER}.
      </p>

      <section className="mb-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">
          Checking warranty (all products)
        </h2>
        <p className="text-muted">
          Every product is tested and checked before it is dispatched, and
          packed properly for courier handling. When your parcel arrives,
          please check the product at once. If it does not work, is damaged,
          or is not what you ordered, contact us on WhatsApp with your order
          number and a short video or photo of the issue. We will look into
          it case by case and offer a repair or replacement where the fault
          is ours.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">
          Warranty items (3 or 6 months)
        </h2>
        <p className="text-muted">
          Some products carry a 3-month or 6-month warranty, the warranty
          period is shown on the product page. If the product stops working
          within its warranty period, we will arrange pickup of the parcel
          from your home and deliver it back to your doorstep repaired (or
          replaced where repair is not possible). The courier charges for
          pickup and return delivery are paid by the customer. Customers in
          Karachi can also bring the product to our shop in Shahjahan
          Electronics Market, Saddar, Karachi for a warranty claim, no
          courier charges then.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">
          What is not covered
        </h2>
        <ul className="list-disc pl-6 text-muted">
          <li>Products with no warranty beyond the checking warranty (most accessories).</li>
          <li>Damage caused by misuse, water, drops, or unauthorised repair.</li>
          <li>Items returned without an order number or after the checking/warranty period.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">How to claim</h2>
        <p className="text-muted">
          WhatsApp {WHATSAPP_NUMBER} with your order number, the product
          name, and a video or photo showing the problem. Keep the original
          box and accessories where possible, they speed up the claim.
        </p>
        <a
          href={whatsappLink("Assalam-o-Alaikum! Mujhe warranty claim karna hai.")}
          target="_blank"
          rel="noopener noreferrer"
          className="press mt-4 inline-flex min-h-12 items-center rounded-full bg-battery px-6 py-3 font-semibold text-canvas hover:bg-battery-deep"
        >
          Claim on WhatsApp
        </a>
      </section>

      <p className="text-sm text-muted">
        We do not offer refunds, our model is repair or replacement where
        the fault is ours.
      </p>
    </div>
  );
}
