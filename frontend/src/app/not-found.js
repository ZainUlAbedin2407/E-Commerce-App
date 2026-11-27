import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="mb-4 font-display text-4xl font-bold text-ink">
        Page not found
      </h1>
      <p className="mb-8 text-gray-600">
        This page does not exist. It may have moved, or the link is wrong.
      </p>
      <Link
        href="/"
        className="inline-block rounded-lg bg-battery px-6 py-3 font-semibold text-canvas hover:bg-battery-deep"
      >
        Back to Home
      </Link>
    </div>
  );
}
