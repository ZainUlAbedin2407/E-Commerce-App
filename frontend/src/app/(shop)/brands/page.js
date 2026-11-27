import Link from "next/link";
import { getBrandsWithCounts, DbUnavailableError } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Brands, AI Communication",
  description: "Brands stocked at AI Communication, Shahjahan Electronics Market, Saddar, Karachi.",
};

export default async function BrandsPage({ searchParams }) {
  const sp = await searchParams;
  const q = (sp.q || "").toLowerCase().trim();
  let brands = [];
  let dbDown = false;
  try {
    brands = await getBrandsWithCounts();
  } catch (err) {
    if (err instanceof DbUnavailableError || err?.code === "db_unavailable") dbDown = true;
    else throw err;
  }
  const filtered = q
    ? brands.filter((b) => b.name.toLowerCase().includes(q))
    : brands;
  const groups = {};
  for (const b of filtered) {
    const letter = (b.name[0] || "#").toUpperCase();
    groups[letter] = groups[letter] || [];
    groups[letter].push(b);
  }
  const letters = Object.keys(groups).sort();

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-12">
      <h1 className="font-display text-3xl font-bold text-ink">Brands</h1>
      <p className="mt-2 text-muted">
        Every brand we stock, with the products we carry from it.
      </p>
      <form method="get" className="mt-6 max-w-md">
        <input
          type="search"
          name="q"
          defaultValue={sp.q || ""}
          placeholder="Search brands, e.g. OMXMO"
          aria-label="Search brands"
          className="min-h-12 w-full rounded-xl border border-line bg-surface p-3 text-base text-ink placeholder:text-muted"
        />
      </form>
      {dbDown && (
        <p className="mt-6 text-muted">
          The shop is temporarily unavailable, please try again shortly.
        </p>
      )}
      {filtered.length === 0 && !dbDown && (
        <p className="mt-6 text-muted">No brands match that search.</p>
      )}
      {letters.map((letter) => (
        <section key={letter} className="mt-10">
          <h2 className="mb-4 font-display text-2xl font-bold text-battery">{letter}</h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups[letter].map((b) => (
              <li key={b.slug} className="rounded-2xl border border-line bg-surface p-5">
                <Link href={`/brands/${b.slug}`} className="font-display text-lg font-bold text-ink hover:text-battery">
                  {b.name}
                </Link>
                {b.description && <p className="mt-1 text-sm text-muted">{b.description}</p>}
                <p className="mt-2 text-sm text-muted">
                  {b.productCount} product{b.productCount === 1 ? "" : "s"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
