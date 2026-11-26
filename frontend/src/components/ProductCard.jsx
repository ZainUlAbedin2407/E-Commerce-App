import Image from "next/image";
import Link from "next/link";
import PriceTag from "./PriceTag";

export default function ProductCard({ product }) {
  const image = product.images[0];
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand-orange hover:shadow-md"
    >
      <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-lg bg-brand-paper">
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        {product.isNew && (
          <span className="absolute left-2 top-2 rounded-full bg-brand-orange px-2 py-1 text-xs font-bold uppercase tracking-wide text-white">
            New
          </span>
        )}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {product.brand} · {product.model}
      </p>
      <h3 className="mt-1 font-display text-sm font-semibold text-brand-black">
        {product.name}
      </h3>
      <div className="mt-2">
        <PriceTag product={product} />
      </div>
    </Link>
  );
}
