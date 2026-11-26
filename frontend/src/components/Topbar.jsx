import { IoLogoInstagram, IoLogoWhatsapp } from "react-icons/io";
import { TbBrandMeta } from "react-icons/tb";
import { WHATSAPP_NUMBER, whatsappLink } from "@/lib/site";

export default function Topbar() {
  return (
    <div className="bg-brand-orange text-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-2">
        <div className="hidden items-center space-x-4 md:flex">
          <a
            href="https://www.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="hover:text-brand-cream"
          >
            <TbBrandMeta className="h-5 w-5" />
          </a>
          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:text-brand-cream"
          >
            <IoLogoInstagram className="h-5 w-5" />
          </a>
        </div>
        <p className="flex-grow text-center text-sm font-medium">
          Delivery across Pakistan — Cash on Delivery available
        </p>
        <a
          href={whatsappLink("Assalam-o-Alaikum AI Communication!")}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1 text-sm font-semibold hover:text-brand-cream md:flex"
        >
          <IoLogoWhatsapp className="h-4 w-4" />
          WhatsApp {WHATSAPP_NUMBER}
        </a>
      </div>
    </div>
  );
}
