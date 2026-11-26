"use client";

import { useRouter } from "next/navigation";
import { IoMdClose } from "react-icons/io";
import CartContents from "./CartContents";
import { useCart } from "@/lib/cart-context";

export default function CartDrawer({ drawerOpen, toggleCartDrawer }) {
  const router = useRouter();
  const { items } = useCart();

  const handleCheckout = () => {
    toggleCartDrawer();
    router.push("/checkout");
  };

  return (
    <div
      className={`fixed right-0 top-0 z-50 flex h-full w-[18rem] flex-col bg-white shadow-lg transition-transform duration-300 sm:w-1/2 md:w-[25rem] ${
        drawerOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex justify-end p-4">
        <button onClick={toggleCartDrawer} aria-label="Close cart">
          <IoMdClose className="h-6 w-6 cursor-pointer text-gray-600" />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-4">
        <h2 className="mb-4 text-xl font-semibold">Your Cart</h2>
        <CartContents />
      </div>
      <div className="sticky bottom-0 bg-white p-4">
        <button
          onClick={handleCheckout}
          disabled={items.length === 0}
          className="w-full cursor-pointer rounded-lg bg-brand-black py-3 font-semibold text-white transition hover:bg-brand-charcoal disabled:cursor-not-allowed disabled:opacity-40"
        >
          Checkout
        </button>
        <p className="mt-2 text-center text-sm tracking-tighter text-gray-500">
          Cash on Delivery — delivery across Pakistan
        </p>
      </div>
    </div>
  );
}
