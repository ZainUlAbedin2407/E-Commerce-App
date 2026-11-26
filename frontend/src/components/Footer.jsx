import Image from "next/image";
import Link from "next/link";
import { IoLogoInstagram, IoLogoWhatsapp } from "react-icons/io";
import { TbBrandMeta } from "react-icons/tb";
import { FiPhoneCall } from "react-icons/fi";
import { CATEGORIES } from "@/lib/products";
import { SHOP_ADDRESS, WHATSAPP_NUMBER, whatsappLink } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-brand-charcoal px-4 py-12 text-brand-cream">
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 md:grid-cols-4 lg:px-0">
        <div>
          <Image
            src="/brand-logo-dark.png"
            alt="AI Communication"
            width={120}
            height={120}
            className="mb-4 h-20 w-20 rounded-lg object-cover"
          />
          <h3 className="font-display text-lg font-bold uppercase tracking-wide">
            AI Communication
          </h3>
          <p className="mt-2 text-sm text-gray-300">Smart Gadgets &amp; Gear</p>
          <p className="mt-2 text-sm text-gray-300">{SHOP_ADDRESS}</p>
          <p className="mt-2 text-sm text-gray-300">
            Mobile accessories only — original products, sealed pack.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-lg text-white">Shop</h3>
          <ul className="space-y-2 text-gray-300">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/collections/${c.slug}`} className="transition-colors hover:text-brand-orange">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg text-white">Support</h3>
          <ul className="space-y-2 text-gray-300">
            <li>
              <Link href="/my-orders" className="transition-colors hover:text-brand-orange">
                My Orders
              </Link>
            </li>
            <li>
              <Link href="/checkout" className="transition-colors hover:text-brand-orange">
                Checkout (COD)
              </Link>
            </li>
            <li>
              <a
                href={whatsappLink("Assalam-o-Alaikum! Mujhe AI Communication se order karna hai.")}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-brand-orange"
              >
                Order on WhatsApp
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg text-white">Contact Us</h3>
          <div className="mb-6 flex items-center space-x-4">
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:text-brand-orange"
            >
              <TbBrandMeta className="h-5 w-5" />
            </a>
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-brand-orange"
            >
              <IoLogoInstagram className="h-5 w-5" />
            </a>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="hover:text-brand-orange"
            >
              <IoLogoWhatsapp className="h-5 w-5" />
            </a>
          </div>
          <p className="text-gray-300">WhatsApp / Call</p>
          <p className="text-sm">
            <FiPhoneCall className="mr-2 inline-block" />
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange">
              {WHATSAPP_NUMBER}
            </a>
          </p>
          <p className="mt-2 text-sm text-gray-300">Delivery across Pakistan</p>
        </div>
      </div>
      <div className="container mx-auto mt-12 border-t border-gray-700 px-4 pt-6 lg:px-0">
        <p className="text-center text-sm tracking-tighter text-gray-400">
          © {new Date().getFullYear()} AI Communication, Saddar, Karachi. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
