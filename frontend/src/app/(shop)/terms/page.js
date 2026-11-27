import { SHOP_ADDRESS, WHATSAPP_NUMBER, whatsappLink } from "@/lib/site";

export const metadata = {
  title: "Terms and Conditions, AI Communication",
  description:
    "Terms of ordering from AI Communication, Saddar, Karachi: when an order becomes a contract, pricing, liability and complaints.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-12">
      <h1 className="font-display text-3xl font-bold text-ink">Terms and Conditions</h1>
      <p className="mt-2 text-muted">
        AI Communication, {SHOP_ADDRESS}. WhatsApp {WHATSAPP_NUMBER}.
      </p>

      <section className="mt-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">When an order becomes a contract</h2>
        <p className="text-muted">
          When you place an order on the website and we give you an order
          number, that is our acceptance of your order, and the order becomes
          a contract between you and AI Communication. The contract covers
          the items, quantities and prices shown on your order, plus the
          delivery charge shown at checkout. The receipt on your order
          confirmation and order page shows the date, the description and
          quantity of each item, the price, and our name and address.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">Prices and payment</h2>
        <p className="text-muted">
          Prices are shown in Pakistani rupees and include no hidden charges:
          the total at checkout is the items plus the delivery charge. Cash on
          Delivery is available for orders up to Rs 2,000. Above that, orders
          are paid 100 percent in advance by bank transfer, JazzCash,
          Easypaisa or Raast, within 24 hours of placing the order. An advance
          order that is not paid within 24 hours is cancelled automatically.
          If a price on the site is clearly wrong (for example a typing
          error), we will contact you before dispatch and you may cancel the
          order.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">Stock and dispatch</h2>
        <p className="text-muted">
          All products are subject to availability. If an item goes out of
          stock after you order, we will contact you and offer a replacement
          or a cancellation. Orders are dispatched from our shop in Saddar
          after payment confirmation.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">Warranty and returns</h2>
        <p className="text-muted">
          Every product carries a checking warranty. Some items carry a 3 or 6
          month warranty, shown on the product page. The full policy is on the
          Returns and Warranty page. We do not offer refunds, our model is
          repair or replacement where the fault is ours.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">Liability</h2>
        <p className="text-muted">
          Our liability for an order is limited to the price you paid for
          that order. We are not liable for loss caused by wrong address or
          phone details you gave us, by courier delay, or by misuse of the
          product after delivery.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">Complaints</h2>
        <p className="text-muted">
          If you have a complaint, send it in writing first, on WhatsApp to{" "}
          {WHATSAPP_NUMBER} with your order number, or by visiting the shop.
          We log every complaint and reply within 15 days. Keep your order
          number and receipt safe until the complaint is resolved.
        </p>
        <a
          href={whatsappLink("Assalam-o-Alaikum! Mujhe shikayat darj karni hai.")}
          target="_blank"
          rel="noopener noreferrer"
          className="press mt-4 inline-flex min-h-12 items-center rounded-full bg-battery px-6 py-3 font-semibold text-canvas hover:bg-battery-deep"
        >
          Message us on WhatsApp
        </a>
      </section>
    </div>
  );
}
