import Image from "next/image";
import Link from "next/link";
import { getProduct } from "@/lib/products";
import PriceTag from "./PriceTag";

// `product` comes from the catalogue (DB or seed) via the home page.
export default function FeaturedCollection({ product }) {
  const featured = product || getProduct("dv-1089");
  if (!featured) return null;
  product = featured;

  return (
    <section className="px-4 py-16 lg:px-0">
      <div className="container mx-auto flex flex-col-reverse items-center rounded-3xl bg-brand-charcoal lg:flex-row">
        <div className="p-8 text-center text-white lg:w-1/2 lg:text-left">
          <h2 className="mb-2 text-lg font-semibold text-brand-orange">
            Featured Product
          </h2>
          <h2 className="mb-6 font-display text-4xl font-bold lg:text-5xl">
            {product.name}
          </h2>
          <p className="mb-6 text-lg text-brand-cream">
            {product.shortDesc} Phone-holder slot on top, solar panel on the
            back, FM radio, USB and TF card — made for long trips and load-shedding
            evenings alike.
          </p>
          <div className="mb-6 flex justify-center lg:justify-start">
            <PriceTag product={product} size="lg" />
          </div>
          <Link
            href={`/product/${product.slug}`}
            className="inline-block rounded-lg bg-brand-orange px-6 py-3 text-lg font-semibold text-white hover:bg-brand-orange-dark"
          >
            View Product
          </Link>
        </div>
        <div className="lg:w-1/2">
          <Image
            src={product.images[1] || product.images[0]}
            alt={product.name}
            width={1024}
            height={1024}
            className="h-full w-full object-cover lg:rounded-br-3xl lg:rounded-tr-3xl"
          />
        </div>
      </div>
    </section>
  );
}
