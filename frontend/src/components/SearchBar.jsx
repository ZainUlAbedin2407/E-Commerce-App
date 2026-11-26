"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiMagnifyingGlass, HiMiniXMark } from "react-icons/hi2";

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    setIsOpen(false);
    router.push(q ? `/collections/all?search=${encodeURIComponent(q)}` : "/collections/all");
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} aria-label="Search products">
        <HiMagnifyingGlass className="h-6 w-6 cursor-pointer text-gray-700 hover:text-brand-orange" />
      </button>
    );
  }

  return (
    <div className="absolute left-0 top-0 z-50 flex h-24 w-full items-center justify-center bg-white">
      <form
        onSubmit={handleSearch}
        className="relative flex w-full items-center justify-center"
      >
        <div className="relative w-1/2">
          <input
            type="text"
            placeholder="Search earbuds, smartwatches, power banks…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full rounded-lg bg-gray-100 px-4 py-2 pr-12 placeholder:text-gray-700 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
          >
            <HiMagnifyingGlass className="h-6 w-6 cursor-pointer" />
          </button>
        </div>
        <button
          type="button"
          aria-label="Close search"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
          onClick={() => setIsOpen(false)}
        >
          <HiMiniXMark className="h-6 w-6 cursor-pointer" />
        </button>
      </form>
    </div>
  );
}
