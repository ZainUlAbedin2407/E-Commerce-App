"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.error ||
            (data.code === "db_not_configured"
              ? "Accounts are not connected yet — the database is not configured."
              : "Registration failed. Try again.")
        );
        return;
      }
      router.push("/profile");
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
          <h2 className="mb-6 text-center font-display text-2xl font-bold">Register</h2>
          <p className="mb-6 text-center text-gray-600">
            Enter your name, email and password to register.
          </p>
          {error && (
            <p className="mb-4 rounded bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          <div className="mb-4">
            <label htmlFor="name" className="mb-2 block text-sm font-semibold">Name</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-gray-200 p-2"
              placeholder="Enter your Name"
            />
          </div>
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
            <label htmlFor="phone" className="mb-2 block text-sm font-semibold">
              Phone (WhatsApp) — optional
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded border border-gray-200 p-2"
              placeholder="03XX-XXXXXXX"
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
              placeholder="At least 8 characters"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full cursor-pointer rounded-lg bg-brand-black p-2 font-semibold text-white transition hover:bg-brand-charcoal disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Sign Up"}
          </button>
          <p className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-orange">
              Login
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
