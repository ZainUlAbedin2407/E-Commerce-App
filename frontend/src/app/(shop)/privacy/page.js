import { SHOP_ADDRESS, WHATSAPP_NUMBER } from "@/lib/site";

export const metadata = {
  title: "Privacy Policy, AI Communication",
  description:
    "How AI Communication collects, uses and stores your name, phone, address and order history.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-12">
      <h1 className="font-display text-3xl font-bold text-ink">Privacy Policy</h1>
      <p className="mt-2 text-muted">
        AI Communication, {SHOP_ADDRESS}. WhatsApp {WHATSAPP_NUMBER}.
      </p>

      <section className="mt-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">What we collect</h2>
        <p className="text-muted">
          When you place an order, we collect your name, phone number,
          delivery address and city, and the items you ordered. If you create
          an account, we also keep your email address and password (stored
          encrypted). If you leave a review, we keep your name, rating and
          review text, plus the order number and phone you gave to verify it.
          We do not collect payment card details: advance payments are made
          by bank transfer, JazzCash, Easypaisa or Raast, and we only keep the
          transaction ID and the receipt screenshot you upload.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">Why we collect it</h2>
        <p className="text-muted">
          Your name, phone and address are needed to deliver your order and to
          contact you about it. Your order history is needed for warranty
          claims, returns and order tracking. Your phone number is also used
          to verify reviews against delivered orders.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">How it is stored</h2>
        <p className="text-muted">
          Orders, accounts and reviews are stored in the shop database, and
          only the shop owner and the shop admin can see them. Product photos
          you upload (for example a payment receipt) are stored with the
          order. We do not sell your data, and we do not share it with
          advertisers.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">WhatsApp contact</h2>
        <p className="text-muted">
          When you message us on WhatsApp about an order, a return or the
          shop, that chat stays on WhatsApp under WhatsApp own rules. We use
          your WhatsApp messages only to answer you and to handle your order
          or claim. Order updates and review requests may also come to you on
          WhatsApp, on the number you gave at checkout.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-display text-xl font-bold text-ink">Your choices</h2>
        <p className="text-muted">
          You can ask us to correct your account details, or to delete your
          account, by messaging us on WhatsApp. Orders that have been placed
          are kept for our records and for warranty claims, even after an
          account is deleted.
        </p>
      </section>
    </div>
  );
}
