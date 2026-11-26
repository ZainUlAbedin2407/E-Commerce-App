import { Toaster } from "sonner";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";

export const metadata = {
  title: "AI Communication — Smart Gadgets & Gear | Saddar, Karachi",
  description:
    "AI Communication, Shahjahan Electronics Market, Saddar, Karachi. Original earbuds, smartwatches, power banks, speakers and fast chargers. Cash on Delivery across Pakistan. WhatsApp 0335-5186552.",
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
