"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.error ||
            (data.code === "db_not_configured"
              ? "Accounts are not connected yet — the database is not configured."
              : "Login failed. Try again.")
        );
        return;
      }
      const next = searchParams.get("next");
      if (next && next.startsWith("/")) router.push(next);
      else if (data.user?.role === "admin") router.push("/admin");
      else router.push("/profile");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex">
      <div className="flex w-full flex-col items-center justify-center p-8 md:w-1/2 md:p-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm"
        >
          <div className="mb-6 flex justify-center">
            <Image
              src="/brand-logo-dark.png"
              alt="AI Communication"
              width={72}
              height={72}
              className="h-16 w-16 rounded-lg object-cover"
            />
          </div>
          <h2 className="mb-6 text-center font-display text-2xl font-bold">Login</h2>
          <p className="mb-6 text-center text-gray-600">
            Enter your email and password to login.
          </p>
          {error && (
            <p className="mb-4 rounded bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          <div className="mb-4">
            <label htmlFor="email" className="mb-2 block text-sm font-semibold">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-200 p-2"
              placeholder="Enter your email address"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="mb-2 block text-sm font-semibold">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-gray-200 p-2"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full cursor-pointer rounded-lg bg-brand-black p-2 font-semibold text-white transition hover:bg-brand-charcoal disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
          <p className="mt-6 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-brand-orange">
              Register
            </Link>
          </p>
        </form>
      </div>
      <div className="hidden w-1/2 md:block">
        <Image
          src="/brand-banner.jpg"
          alt="AI Communication — Smart Gadgets & Gear, Saddar, Karachi"
          width={1344}
          height={756}
          className="h-[750px] w-full object-cover"
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-gray-500">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
