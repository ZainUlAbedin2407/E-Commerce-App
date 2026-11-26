"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getNewProducts } from "@/lib/products";
import PriceTag from "./PriceTag";

// `products` comes from the catalogue (DB or seed) via the home page.
export default function NewArrivals({ products }) {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const newArrivals = products || getNewProducts();

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = x - startX;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => setIsDragging(false);

  const scroll = (direction) => {
    const scrollAmount = direction === "left" ? -300 : 300;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const updateScrollButtons = () => {
    const container = scrollRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener("scroll", updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);
    updateScrollButtons();
    return () => {
      container.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, []);

  return (
    <section className="px-4 py-16 lg:px-0">
      <div className="container relative mx-auto mb-10 text-center">
        <h2 className="mb-4 font-display text-3xl font-bold uppercase tracking-wide text-brand-black">
          New Arrivals
        </h2>
        <p className="mb-8 text-sm text-gray-600 lg:text-lg">
          Fresh stock at AI Communication — original products, sealed pack.
        </p>
        <div className="z-10 flex justify-end gap-2 lg:absolute lg:bottom-[-35px] lg:right-0">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className={`rounded border border-gray-200 p-2 transition-colors duration-300 ${
              canScrollLeft
                ? "cursor-pointer bg-white text-black"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            <FiChevronLeft className="text-2xl" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className={`rounded border border-gray-200 p-2 transition-colors duration-300 ${
              canScrollRight
                ? "cursor-pointer bg-white text-black"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            <FiChevronRight className="text-2xl" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={`container mx-auto flex space-x-6 overflow-x-auto scrollbar-hide ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      >
        {newArrivals.map((product) => (
          <div
            key={product.id}
            className="relative min-w-[100%] sm:min-w-[50%] lg:min-w-[30%]"
          >
            <Image
              src={product.images[0]}
              alt={product.name}
              width={600}
              height={500}
              className="h-[500px] w-full rounded-lg object-cover"
              draggable={false}
            />
            <div className="absolute inset-x-0 bottom-0 rounded-b-lg p-4 text-white backdrop-blur-md">
              <Link href={`/product/${product.slug}`} className="block">
                <h4 className="font-medium">{product.name}</h4>
              </Link>
              <div className="mt-1">
                <PriceTag product={product} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
