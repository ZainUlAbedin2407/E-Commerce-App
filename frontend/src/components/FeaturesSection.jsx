import {
  HiShoppingBag,
  HiOutlineCreditCard,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

export default function FeaturesSection() {
  return (
    <section className="bg-white px-4 py-16">
      <div className="container mx-auto grid grid-cols-1 gap-8 text-center md:grid-cols-3">
        <div className="flex flex-col items-center">
          <div className="mb-4 rounded-full bg-brand-paper p-4">
            <HiOutlineCreditCard className="text-2xl text-brand-orange" />
          </div>
          <h4 className="mb-2 font-display font-bold uppercase tracking-wide">
            Cash on Delivery
          </h4>
          <p className="text-sm tracking-tighter text-gray-600">
            Pay when your order reaches your door — no advance payment needed.
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className="mb-4 rounded-full bg-brand-paper p-4">
            <HiShoppingBag className="text-2xl text-brand-orange" />
          </div>
          <h4 className="mb-2 font-display font-bold uppercase tracking-wide">
            Delivery Across Pakistan
          </h4>
          <p className="text-sm tracking-tighter text-gray-600">
            Karachi, Lahore, Islamabad and all over Pakistan — order on WhatsApp
            and we deliver to you.
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className="mb-4 rounded-full bg-brand-paper p-4">
            <HiOutlineShieldCheck className="text-2xl text-brand-orange" />
          </div>
          <h4 className="mb-2 font-display font-bold uppercase tracking-wide">
            100% Original Products
          </h4>
          <p className="text-sm tracking-tighter text-gray-600">
            Original URPIN, OMXMO and branded accessories — sealed pack, no
            fake items.
          </p>
        </div>
      </div>
    </section>
  );
}
