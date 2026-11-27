"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FaFilter } from "react-icons/fa";
import { HiMiniXMark } from "react-icons/hi2";
import { CATEGORIES, getBrands } from "@/lib/products";

// Filter state lives in the URL, so filtered pages are shareable.
// Definitions come from /api/filters; values are derived from the
// products themselves and arrive as facets. Mobile: one Filter button
// opens a bottom sheet with counts next to every option, removable
// chips, and Clear All.
const SORT_OPTIONS = [
  { value: "", label: "Featured" },
  { value: "best", label: "Best selling" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
];

export default function FilterSidebar({ categories, brands, definitions, facets }) {
  const categoryList = categories || CATEGORIES;
  const brandList = brands || getBrands().map((b) => ({ slug: b, name: b }));
  const defs = definitions || [];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") || "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") || "");

  const currentCategory = pathname.split("/").pop();
  const selectedBrand = searchParams.get("brand") || "";
  const selectedSort = searchParams.get("sort") || "";
  const inStock = searchParams.get("inStock") === "1";
  const selectedRating = searchParams.get("rating") || "";
  const brandFacets = facets?.brands || [];
  const brandCount = (slug) => brandFacets.find((b) => b.slug === slug)?.count;
  const specFacets = facets?.specs || {};
  const priceRange = facets?.price || {};
  const defEnabled = (source) =>
    defs.length === 0 || defs.some((d) => d.source === source || d.key === source);

  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || value == null) params.delete(key);
      else params.set(key, String(value));
    });
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const activeChips = [];
  if (selectedBrand) {
    const name = brandList.find((b) => (b.slug || b) === selectedBrand)?.name || selectedBrand;
    activeChips.push({ label: `Brand: ${name}`, clear: { brand: "" } });
  }
  if (searchParams.get("priceMin") || searchParams.get("priceMax")) {
    activeChips.push({
      label: `Price: ${searchParams.get("priceMin") || "0"} to ${searchParams.get("priceMax") || "any"}`,
      clear: { priceMin: "", priceMax: "" },
    });
  }
  if (inStock) activeChips.push({ label: "In stock", clear: { inStock: "" } });
  if (selectedRating) activeChips.push({ label: `${selectedRating} stars and up`, clear: { rating: "" } });
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith("spec_")) {
      activeChips.push({ label: `${key.slice(5)}: ${value}`, clear: { [key]: "" } });
    }
  }
  if (searchParams.get("search")) {
    activeChips.push({ label: `Search: ${searchParams.get("search")}`, clear: { search: "" } });
  }

  // Escape closes the mobile sheet.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const filterBody = (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-ink">Filters</h3>
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Close filters"
          className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-muted hover:bg-raised lg:hidden"
        >
          <HiMiniXMark className="h-6 w-6" />
        </button>
      </div>

      <div className="mb-6">
        <h4 className="mb-2 font-semibold text-ink">Category</h4>
        {[{ slug: "all", name: "All Products" }, ...categoryList].map((c) => (
          <button
            key={c.slug}
            onClick={() => router.push(`/collections/${c.slug}`)}
            className={`mb-1 block w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm ${
              currentCategory === c.slug
                ? "bg-battery font-semibold text-canvas"
                : "text-muted hover:bg-raised hover:text-ink"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {defEnabled("brand") && (
        <div className="mb-6">
          <h4 className="mb-2 font-semibold text-ink">Brand</h4>
          <div className="flex flex-wrap gap-2">
            {[{ slug: "", name: "All brands" }, ...brandList].map((brand) => {
              const slug = brand.slug || brand;
              const name = brand.name || brand;
              const count = brand.slug ? brandCount(brand.slug) : undefined;
              return (
                <button
                  key={slug || "all"}
                  onClick={() => updateParams({ brand: slug })}
                  aria-pressed={selectedBrand === slug}
                  className={`min-h-12 cursor-pointer rounded-full border px-3 py-2 text-sm font-semibold ${
                    selectedBrand === slug
                      ? "border-battery bg-battery text-canvas"
                      : "border-line bg-surface text-muted hover:border-battery hover:text-ink"
                  }`}
                >
                  {name}
                  {count != null ? ` (${count})` : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {defEnabled("price") && (
        <div className="mb-6">
          <h4 className="mb-2 font-semibold text-ink">Price</h4>
          <p className="mb-2 text-xs text-muted">
            {priceRange.min != null
              ? `From Rs. ${priceRange.min.toLocaleString("en-PK")} to Rs. ${priceRange.max.toLocaleString("en-PK")}`
              : "Enter a price range."}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="Min"
              aria-label="Minimum price"
              className="min-h-12 w-full rounded-xl border border-line bg-raised p-3 text-base text-ink placeholder:text-muted"
            />
            <span className="text-muted">to</span>
            <input
              type="number"
              min="0"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="Max"
              aria-label="Maximum price"
              className="min-h-12 w-full rounded-xl border border-line bg-raised p-3 text-base text-ink placeholder:text-muted"
            />
          </div>
          <button
            onClick={() => updateParams({ priceMin, priceMax })}
            className="press mt-2 min-h-12 w-full cursor-pointer rounded-full border border-line bg-raised font-semibold text-ink"
          >
            Apply price
          </button>
        </div>
      )}

      {Object.entries(specFacets).map(([key, values]) => {
        if (!defEnabled(`spec:${key}`)) return null;
        const selected = searchParams.get(`spec_${key}`) || "";
        return (
          <div key={key} className="mb-6">
            <h4 className="mb-2 font-semibold text-ink">{key}</h4>
            <div className="flex flex-wrap gap-2">
              {[{ value: "", count: null }, ...values].map((v) => (
                <button
                  key={v.value || "all"}
                  onClick={() => updateParams({ [`spec_${key}`]: v.value })}
                  aria-pressed={selected === v.value}
                  className={`min-h-12 cursor-pointer rounded-full border px-3 py-2 text-sm font-semibold ${
                    selected === v.value
                      ? "border-battery bg-battery text-canvas"
                      : "border-line bg-surface text-muted hover:border-battery hover:text-ink"
                  }`}
                >
                  {v.value || "All"}
                  {v.count != null ? ` (${v.count})` : ""}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {defEnabled("rating") && (
        <div className="mb-6">
          <h4 className="mb-2 font-semibold text-ink">Rating</h4>
          <div className="flex flex-wrap gap-2">
            {["", "5", "4", "3"].map((r) => (
              <button
                key={r || "all"}
                onClick={() => updateParams({ rating: r })}
                aria-pressed={selectedRating === r}
                className={`min-h-12 cursor-pointer rounded-full border px-3 py-2 text-sm font-semibold ${
                  selectedRating === r
                    ? "border-battery bg-battery text-canvas"
                    : "border-line bg-surface text-muted hover:border-battery hover:text-ink"
                }`}
              >
                {r ? `${r} stars and up` : "Any rating"}
              </button>
            ))}
          </div>
        </div>
      )}

      {defEnabled("availability") && (
        <label className="mb-6 flex min-h-12 cursor-pointer items-center gap-3 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => updateParams({ inStock: e.target.checked ? "1" : "" })}
            className="h-5 w-5 accent-[#FF7A1A]"
          />
          In stock only
        </label>
      )}

      <div className="mb-6">
        <h4 className="mb-2 font-semibold text-ink">Sort</h4>
        <div className="overflow-hidden rounded-xl border border-line">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParams({ sort: opt.value })}
              aria-pressed={selectedSort === opt.value}
              className={`block w-full cursor-pointer px-3 py-3 text-left text-sm ${
                selectedSort === opt.value
                  ? "bg-battery font-semibold text-canvas"
                  : "bg-surface text-muted hover:bg-raised hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {activeChips.length > 0 && (
        <button
          onClick={() => router.push(pathname, { scroll: false })}
          className="cursor-pointer text-sm font-semibold text-battery hover:text-battery-deep"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 lg:hidden">
        <button
          className="press flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-line bg-surface px-5 text-ink"
          onClick={() => setIsOpen(true)}
        >
          <FaFilter className="mr-2" /> Filters
          {activeChips.length > 0 ? ` (${activeChips.length})` : ""}
        </button>
        {activeChips.map((chip) => (
          <button
            key={chip.label}
            onClick={() => updateParams(chip.clear)}
            aria-label={`Remove filter ${chip.label}`}
            className="flex min-h-12 cursor-pointer items-center gap-1 rounded-full bg-battery px-3 py-2 text-sm font-semibold text-canvas"
          >
            {chip.label} <HiMiniXMark className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div className="mb-4 hidden flex-wrap items-center gap-2 lg:flex">
        {activeChips.map((chip) => (
          <button
            key={chip.label}
            onClick={() => updateParams(chip.clear)}
            aria-label={`Remove filter ${chip.label}`}
            className="flex min-h-12 cursor-pointer items-center gap-1 rounded-full bg-battery px-3 py-2 text-sm font-semibold text-canvas"
          >
            {chip.label} <HiMiniXMark className="h-4 w-4" />
          </button>
        ))}
        {activeChips.length > 0 && (
          <button
            onClick={() => router.push(pathname, { scroll: false })}
            className="cursor-pointer text-sm font-semibold text-battery hover:text-battery-deep"
          >
            Clear all
          </button>
        )}
      </div>

      {isOpen && (
        <button
          aria-label="Close filters"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-canvas/70 lg:hidden"
        />
      )}
      <div
        className={`drawer-slide fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface lg:hidden ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-label="Filters"
        aria-hidden={!isOpen}
      >
        {filterBody}
      </div>
      <aside className="hidden w-64 shrink-0 lg:block">{filterBody}</aside>
    </>
  );
}
