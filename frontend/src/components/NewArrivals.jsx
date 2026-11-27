"use client";

import { useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getNewProducts } from "@/lib/products";
import ProductCard from "./ProductCard";

// Horizontal product row, used for Best Sellers and New Arrivals.
// `products` comes from the catalogue (DB or seed) via the home page.
// Dark cards, square cover images, skeleton-free: the parent hides the
// whole row when the list is empty, so this never renders an empty row.
export default function NewArrivals({ products, title = "New Arrivals" }) {
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const list = products || getNewProducts();
  if (!list || list.length === 0) return null;

  const update = () => {
    const c = scrollRef.current;
    if (!c) return;
    setCanLeft(c.scrollLeft > 0);
    setCanRight(c.scrollLeft < c.scrollWidth - c.clientWidth - 1);
  };

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <section className="px-5 py-12 md:px-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-display text-3xl font-bold text-ink">{title}</h2>
        <div className="hidden gap-2 md:flex">
          <button
            onClick={() => scroll("left")}
            disabled={!canLeft}
            aria-label="Scroll left"
            className="press flex min-h-12 min-w-12 items-center justify-center rounded-full border border-line bg-surface text-ink disabled:opacity-40"
          >
            <FiChevronLeft className="text-2xl" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canRight}
            aria-label="Scroll right"
            className="press flex min-h-12 min-w-12 items-center justify-center rounded-full border border-line bg-surface text-ink disabled:opacity-40"
          >
            <FiChevronRight className="text-2xl" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        onScroll={update}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
      >
        {list.map((product) => (
          <div key={product.id || product.slug} className="w-[70%] shrink-0 sm:w-[45%] lg:w-[31%] xl:w-[23%]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
