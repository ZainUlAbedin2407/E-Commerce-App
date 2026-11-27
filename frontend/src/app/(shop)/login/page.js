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
              ? "Accounts are not connected yet, the database is not configured."
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
          className="w-full max-w-md rounded-2xl border border-line bg-surface p-8"
        >
          <div className="mb-6 flex justify-center">
            <Image
              src="/logo-ai-dark.png"
              alt="AI Communication"
              width={503}
              height={337}
              className="h-16 w-auto rounded-lg"
            />
          </div>
          <h2 className="mb-6 text-center font-display text-2xl font-bold text-ink">Login</h2>
          <p className="mb-6 text-center text-muted">
            Enter your email and password to login.
          </p>
          {error && (
            <p className="mb-4 rounded-xl border border-danger bg-raised p-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <div className="mb-4">
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-ink">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-line bg-raised p-3 text-base text-ink placeholder:text-muted"
              placeholder="Enter your email address"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-ink">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-line bg-raised p-3 text-base text-ink placeholder:text-muted"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="press min-h-12 w-full cursor-pointer rounded-full bg-battery p-2 font-semibold text-canvas transition hover:bg-battery-deep disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
          <p className="mt-6 text-center text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-battery">
              Register
            </Link>
          </p>
        </form>
      </div>
      <div className="hidden w-1/2 md:block">
        <Image
          src="/brand-banner.jpg"
          alt="AI Communication, Smart Gadgets and Gear, Saddar, Karachi"
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
    <Suspense fallback={<p className="p-10 text-center text-muted">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
