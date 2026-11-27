import { Toaster } from "sonner";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://ai-communication-delta.vercel.app";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "AI Communication, Smart Gadgets and Gear | Saddar, Karachi",
  description:
    "AI Communication, Shahjahan Electronics Market, Saddar, Karachi. Original earbuds, smartwatches, power banks, speakers and fast chargers, with delivery across Pakistan. Order on the website.",
  openGraph: {
    title: "AI Communication, Smart Gadgets and Gear | Saddar, Karachi",
    description:
      "Original earbuds, smartwatches, power banks, speakers and fast chargers, with delivery across Pakistan. Order on the website.",
    url: SITE_URL,
    siteName: "AI Communication",
    locale: "en_PK",
    type: "website",
    images: [
      {
        url: "/brand-banner.jpg",
        width: 1344,
        height: 756,
        alt: "AI Communication, Smart Gadgets and Gear, Shahjahan Electronics Market, Saddar, Karachi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Communication, Smart Gadgets and Gear | Saddar, Karachi",
    description:
      "Original earbuds, smartwatches, power banks, speakers and fast chargers, with delivery across Pakistan. Order on the website.",
    images: ["/brand-banner.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <CartProvider>
          <Toaster position="top-right" />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
