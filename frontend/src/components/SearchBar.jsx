"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HiMagnifyingGlass, HiMiniXMark } from "react-icons/hi2";
import { formatPrice } from "@/lib/products";

// Search opens as a fixed full-width overlay: a real overlay with
// debounced suggestions, Escape and click-outside to close. The search
// logic and typo handling are unchanged, only the overlay is restyled
// fully dark.
export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef(null);
  // Latest query the user typed. A fetch that resolves after the user
  // has already typed more must not apply its results: without this
  // guard, typing "speker" briefly flashed "No results for 'speker'",
  // the stale empty result of the intermediate query "spek" landing
  // after the new query started.
  const latestQuery = useRef("");

  // Debounced suggestions (250ms), thumbnails, name, price.
  useEffect(() => {
    const q = query.trim();
    latestQuery.current = q;
    if (!q) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(q)}&limit=6`
        );
        const data = await res.json().catch(() => ({}));
        if (latestQuery.current !== q) return; // stale, a newer query is pending
        setResults(Array.isArray(data.products) ? data.products : []);
      } catch {
        if (latestQuery.current !== q) return;
        setResults([]);
      } finally {
        if (latestQuery.current === q) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Escape closes; body scroll locks while open; input autofocuses.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
    setQuery("");
    setResults(null);
  };

  const goToResults = () => {
    const q = query.trim();
    close();
    router.push(
      q ? `/collections/all?search=${encodeURIComponent(q)}` : "/collections/all"
    );
  };

  const goToProduct = (slug) => {
    close();
    router.push(`/product/${slug}`);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Search products"
        className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-ink hover:bg-raised"
      >
        <HiMagnifyingGlass className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
    >
      <button
        aria-label="Close search"
        onClick={close}
        className="absolute inset-0 cursor-default bg-canvas/70"
      />
      <div className="relative mx-auto mt-16 w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-line bg-surface p-4 shadow-2xl sm:mt-24">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            goToResults();
          }}
          className="flex items-center gap-2"
        >
          <HiMagnifyingGlass className="h-6 w-6 shrink-0 text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search earbuds, smartwatches, power banks…"
            aria-label="Search products"
            className="min-h-12 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Close search"
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-muted hover:bg-raised"
          >
            <HiMiniXMark className="h-6 w-6" />
          </button>
        </form>
        {query.trim() && (
          <div className="mt-2 border-t border-line pt-2">
            {loading && (
              <p className="px-2 py-3 text-sm text-muted">Searching…</p>
            )}
            {!loading && results && results.length === 0 && (
              <button
                onClick={goToResults}
                className="block w-full rounded-lg px-2 py-3 text-left text-sm text-ink hover:bg-raised"
              >
                No results for &ldquo;{query.trim()}&rdquo;, view all products
              </button>
            )}
            {!loading && results && results.length > 0 && (
              <>
                <ul>
                  {results.map((p) => (
                    <li key={p.slug}>
                      <button
                        onClick={() => goToProduct(p.slug)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-raised"
                      >
                        {p.images?.[0] ? (
                          <Image
                            src={p.images[0]}
                            alt=""
                            width={48}
                            height={48}
                            className="h-12 w-12 shrink-0 rounded-lg bg-raised object-cover"
                          />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-raised font-display font-bold text-battery">
                            {p.name.slice(0, 1)}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-ink">
                            {p.name}
                          </span>
                          <span className="block text-xs text-muted">
                            {p.brand}
                            {p.model ? `, ${p.model}` : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-bold text-battery">
                          {p.pricePKR != null
                            ? formatPrice(p.pricePKR)
                            : "Price coming soon"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={goToResults}
                  className="mt-1 block w-full rounded-lg px-2 py-2 text-center text-sm font-semibold text-battery hover:bg-raised"
                >
                  See all results for &ldquo;{query.trim()}&rdquo;
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
