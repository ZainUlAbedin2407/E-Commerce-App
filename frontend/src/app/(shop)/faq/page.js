import Link from "next/link";
import { WHATSAPP_NUMBER } from "@/lib/site";

export const metadata = {
  title: "FAQ, AI Communication",
  description:
    "Frequently asked questions about ordering, shipping, payment, returns and warranty at AI Communication, Saddar, Karachi.",
};

// Every answer is written from the real shop facts in the V3 plan.
// Nothing is invented: no courier names, no delivery day counts, no
// hours, no promises the shop has not made.
const GROUPS = [
  {
    name: "Orders",
    items: [
      {
        q: "How do I place an order?",
        a: "Add products to the cart and check out on the website. You do not need an account, checkout is guest-first. You get an order number when the order is placed, keep it safe, you need it to track the order and for any warranty claim.",
      },
      {
        q: "Can I order on WhatsApp?",
        a: "No. Orders are placed on the website only. WhatsApp is for questions about an order, a return, or the shop.",
      },
      {
        q: "How do I track my order?",
        a: "Use the Track Order page with your order number and the phone number you ordered with. Signed-in customers also see their orders on the My Orders page.",
      },
      {
        q: "I placed an order as a guest. Can I see it on my account?",
        a: "Yes. On the My Orders page, claim it with the order number and the phone number you ordered with, and it moves onto your account.",
      },
    ],
  },
  {
    name: "Shipping",
    items: [
      {
        q: "What are the delivery charges?",
        a: "Karachi Rs 250, rest of Pakistan Rs 300, up to 1 kg. Each additional kg costs Rs 70 more. The exact fee is shown at checkout before you pay.",
      },
      {
        q: "Where do orders ship from?",
        a: "Orders are dispatched from our shop in Shahjahan Electronics Market, Saddar, Karachi, after payment confirmation.",
      },
      {
        q: "Do you deliver across Pakistan?",
        a: "Yes, delivery across Pakistan.",
      },
    ],
  },
  {
    name: "Payments",
    items: [
      {
        q: "What payment methods do you take?",
        a: "Cash on Delivery for orders up to Rs 2,000, and advance payment (bank transfer, JazzCash, Easypaisa or Raast) for orders above that. You can also choose advance payment for a smaller order at checkout.",
      },
      {
        q: "How does advance payment work?",
        a: "After you place the order, the order page shows the bank account, JazzCash and Easypaisa numbers and Raast QR. Pay the exact total and put your order number in the transfer reference, then upload the receipt screenshot and the transaction ID (TRX ID) on the order page. You have 24 hours to pay. Dispatch starts after we verify the amount in our own statement.",
      },
      {
        q: "Why is there a 24 hour payment window?",
        a: "An advance order that is not paid within 24 hours is cancelled automatically, so the stock can go to another customer.",
      },
    ],
  },
  {
    name: "Returns",
    items: [
      {
        q: "What if my parcel arrives damaged or does not work?",
        a: "Check your parcel at once when it arrives. Contact us on WhatsApp with your order number and a short video or photo of the issue. We look into it case by case and offer a repair or replacement where the fault is ours.",
      },
      {
        q: "Do you offer refunds?",
        a: "No. Our model is repair or replacement where the fault is ours.",
      },
      {
        q: "How do I make a warranty claim?",
        a: "Message us on WhatsApp with your order number, the product name, and a video or photo showing the problem. Keep the original box and accessories where possible, they speed up the claim.",
      },
    ],
  },
  {
    name: "Products",
    items: [
      {
        q: "What do you sell?",
        a: "Mobile accessories only: earbuds, smartwatches, power banks, speakers, fast chargers and handsfree. We do not sell home appliances, and we do not do repairs.",
      },
      {
        q: "Are the products original?",
        a: "Yes, original products in sealed packs, from the brands listed on the site. Every product is tested and checked before dispatch.",
      },
      {
        q: "A product has no price. What does that mean?",
        a: "It means the price is not set yet, and the product cannot be ordered until it is. We never ask you to message us for a price.",
      },
    ],
  },
  {
    name: "Warranty",
    items: [
      {
        q: "What is a checking warranty?",
        a: "Every product carries a checking warranty: it is tested before dispatch, and you check it at once when it arrives. If it does not work, is damaged, or is not what you ordered, contact us with your order number and a short video or photo.",
      },
      {
        q: "Which products have a 3 or 6 month warranty?",
        a: "Some items carry a 3-month or 6-month warranty, and the warranty period is shown on the product page. If the product stops working within its warranty period, we arrange pickup from your home and deliver it back repaired to your doorstep. The courier charges are paid by the customer. Karachi customers can also bring the product to the shop in Saddar, with no courier charges.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-12">
      <h1 className="font-display text-3xl font-bold text-ink">Frequently asked questions</h1>
      <p className="mt-2 text-muted">
        If your question is not here, message us on WhatsApp at {WHATSAPP_NUMBER}{" "}
        with your order number.
      </p>
      {GROUPS.map((group) => (
        <section key={group.name} className="mt-10">
          <h2 className="mb-4 font-display text-2xl font-bold text-ink">{group.name}</h2>
          <div className="space-y-3">
            {group.items.map((item) => (
              <details key={item.q} className="rounded-2xl border border-line bg-surface">
                <summary className="cursor-pointer px-5 py-4 font-semibold text-ink">
                  {item.q}
                </summary>
                <p className="border-t border-line px-5 py-4 text-sm text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
      <p className="mt-10 text-sm text-muted">
        Full policies:{" "}
        <Link href="/shipping" className="font-semibold text-battery">Shipping</Link>,{" "}
        <Link href="/returns" className="font-semibold text-battery">Returns and Warranty</Link>,{" "}
        <Link href="/privacy" className="font-semibold text-battery">Privacy</Link>,{" "}
        <Link href="/terms" className="font-semibold text-battery">Terms</Link>.
      </p>
    </div>
  );
}
