import Link from "next/link";
import { SHOP_ADDRESS, SOCIALS, WHATSAPP_NUMBER, whatsappLink } from "@/lib/site";

export const metadata = {
  title: "Contact, AI Communication",
  description:
    "Contact AI Communication, Shahjahan Electronics Market, Saddar, Karachi. WhatsApp 0335-5186552.",
};

// No hours are published: the shop hours were not given in the plan or
// the repo, so none are invented here. No contact form and no map,
// the address and WhatsApp link are the real contact routes.
export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-12">
      <h1 className="font-display text-3xl font-bold text-ink">Contact</h1>
      <p className="mt-2 text-muted">
        Questions about an order, a product, or a warranty claim? Message us
        on WhatsApp with your order number.
      </p>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-xl font-bold text-ink">The shop</h2>
        <p className="mt-2 text-muted">AI Communication</p>
        <p className="text-muted">{SHOP_ADDRESS}</p>
        <p className="mt-3 text-muted">
          WhatsApp (contact only):{" "}
          <a
            href={whatsappLink("Assalam-o-Alaikum AI Communication!")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-battery"
          >
            {WHATSAPP_NUMBER}
          </a>
        </p>
        <p className="mt-2 text-sm text-muted">
          WhatsApp is for questions about an order, a return, or the shop.
          Orders are placed on the website.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-xl font-bold text-ink">Follow us</h2>
        <ul className="mt-3 space-y-2 text-muted">
          <li>
            Instagram:{" "}
            <a href={SOCIALS.instagram} target="_blank" rel="noopener noreferrer" className="font-semibold text-battery">
              instagram.com/aicommunicationkhi
            </a>
          </li>
          <li>
            Facebook:{" "}
            <a href={SOCIALS.facebook} target="_blank" rel="noopener noreferrer" className="font-semibold text-battery">
              facebook.com/aicommunicationkhi
            </a>
          </li>
          <li>
            TikTok:{" "}
            <a href={SOCIALS.tiktok} target="_blank" rel="noopener noreferrer" className="font-semibold text-battery">
              tiktok.com/@aicommunicationkhi
            </a>
          </li>
          <li>
            WhatsApp Community:{" "}
            <a href={SOCIALS.whatsappCommunity} target="_blank" rel="noopener noreferrer" className="font-semibold text-battery">
              Join the community
            </a>
          </li>
        </ul>
      </section>

      <p className="mt-8 text-sm text-muted">
        Before you message, the{" "}
        <Link href="/faq" className="font-semibold text-battery">FAQ</Link> answers
        the common questions about orders, shipping, payments and returns.
      </p>
    </div>
  );
}
