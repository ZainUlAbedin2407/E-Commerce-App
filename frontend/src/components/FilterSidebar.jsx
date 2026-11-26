"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FaFilter } from "react-icons/fa";
import { CATEGORIES, getBrands } from "@/lib/products";

// `categories` / `brands` come from the catalogue (DB or seed) via the
// collection page, so brands added in the admin panel show up here.
export default function FilterSidebar({ categories, brands }) {
  const categoryList = categories || CATEGORIES;
  const brandList = brands || getBrands();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const currentCategory = pathname.split("/").pop();
  const selectedBrand = searchParams.get("brand") || "";
  const selectedSort = searchParams.get("sort") || "";

  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <>
      <button
        className="flex cursor-pointer items-center justify-center border border-gray-200 bg-white p-2 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaFilter className="mr-2" /> Filters
      </button>
      <div
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-white scrollbar-hide transition-transform duration-300 lg:static lg:translate-x-0`}
      >
        <div className="w-64 p-4">
          <h3 className="mb-4 font-display text-lg font-bold uppercase">Filters</h3>

          <div className="mb-6">
            <h4 className="mb-2 font-semibold">Category</h4>
            {[{ slug: "all", name: "All Products" }, ...categoryList].map((c) => (
              <button
                key={c.slug}
                onClick={() => router.push(`/collections/${c.slug}`)}
                className={`mb-1 block w-full cursor-pointer rounded px-2 py-1 text-left text-sm ${
                  currentCategory === c.slug
                    ? "bg-brand-orange font-semibold text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h4 className="mb-2 font-semibold">Brand</h4>
            <select
              value={selectedBrand}
              onChange={(e) => updateParams({ brand: e.target.value })}
              className="w-full rounded border border-gray-200 bg-white p-2 text-sm focus:outline-none"
            >
              <option value="">All Brands</option>
              {brandList.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <h4 className="mb-2 font-semibold">Sort</h4>
            <select
              value={selectedSort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="w-full rounded border border-gray-200 bg-white p-2 text-sm focus:outline-none"
            >
              <option value="">Featured</option>
              <option value="newest">Newest</option>
              <option value="nameAsc">Name: A to Z</option>
              <option value="nameDesc">Name: Z to A</option>
            </select>
            <p className="mt-2 text-xs text-gray-500">
              Prices are confirmed on WhatsApp.
            </p>
          </div>

          {(selectedBrand || selectedSort) && (
            <button
              onClick={() => router.push(pathname, { scroll: false })}
              className="cursor-pointer text-sm font-semibold text-brand-orange hover:text-brand-orange-dark"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>
    </>
  );
}
