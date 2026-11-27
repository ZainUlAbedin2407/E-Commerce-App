"use client";

import { useEffect, useState } from "react";
import {
  apiJson,
  btnPrimary,
  cardCls,
  Field,
  inputCls,
  Notice,
  Toggle,
  UploadField,
} from "@/components/AdminUI";

const EMPTY = {
  shopName: "",
  tagline: "",
  address: "",
  whatsappNumber: "",
  socials: { instagram: "", facebook: "", tiktok: "", whatsappCommunity: "" },
  logoUrl: "",
  bannerUrl: "",
  delivery: { karachiFee: "", otherFee: "", freeUpToKg: "", extraKgFee: "", freeShippingThreshold: "" },
  codMaxTotal: "",
  paymentAccounts: {
    bankName: "",
    accountTitle: "",
    accountNumber: "",
    iban: "",
    jazzcashNumber: "",
    easypaisaNumber: "",
    raastQrUrl: "",
  },
  paymentMethods: [],
  reviewRequestDays: 5,
};

export default function SettingsPage() {
  const [form, setForm] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [newMethodKey, setNewMethodKey] = useState("");
  const [newMethodLabel, setNewMethodLabel] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          if (data.code === "db_not_configured") setNotConfigured(true);
          else setError(data.error || "Could not load settings.");
          return;
        }
        const s = data.settings || {};
        setForm({
          shopName: s.shopName || "",
          tagline: s.tagline || "",
          address: s.address || "",
          whatsappNumber: s.whatsappNumber || "",
          socials: {
            instagram: s.socials?.instagram || "",
            facebook: s.socials?.facebook || "",
            tiktok: s.socials?.tiktok || "",
            whatsappCommunity: s.socials?.whatsappCommunity || "",
          },
          logoUrl: s.logoUrl || "",
          bannerUrl: s.bannerUrl || "",
          delivery: {
            karachiFee: s.delivery?.karachiFee ?? "",
            otherFee: s.delivery?.otherFee ?? "",
            freeUpToKg: s.delivery?.freeUpToKg ?? "",
            extraKgFee: s.delivery?.extraKgFee ?? "",
            freeShippingThreshold: s.delivery?.freeShippingThreshold ?? "",
          },
          codMaxTotal: s.codMaxTotal ?? "",
          paymentAccounts: {
            bankName: s.paymentAccounts?.bankName || "",
            accountTitle: s.paymentAccounts?.accountTitle || "",
            accountNumber: s.paymentAccounts?.accountNumber || "",
            iban: s.paymentAccounts?.iban || "",
            jazzcashNumber: s.paymentAccounts?.jazzcashNumber || "",
            easypaisaNumber: s.paymentAccounts?.easypaisaNumber || "",
            raastQrUrl: s.paymentAccounts?.raastQrUrl || "",
          },
          paymentMethods: s.paymentMethods || [],
          reviewRequestDays: s.reviewRequestDays ?? 5,
        });
      })
      .catch(() => setError("Could not load settings. Check your connection."))
      .finally(() => setLoaded(true));
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setNested = (group, key, value) =>
    setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));

  const numOrNull = (v) => (v === "" || v == null ? null : Number(v));

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await apiJson("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: form.shopName.trim(),
          tagline: form.tagline.trim(),
          address: form.address.trim(),
          whatsappNumber: form.whatsappNumber.trim(),
          socials: {
            instagram: form.socials.instagram.trim(),
            facebook: form.socials.facebook.trim(),
            tiktok: form.socials.tiktok.trim(),
            whatsappCommunity: form.socials.whatsappCommunity.trim(),
          },
          logoUrl: form.logoUrl.trim(),
          bannerUrl: form.bannerUrl.trim(),
          delivery: {
            karachiFee: Number(form.delivery.karachiFee) || 0,
            otherFee: Number(form.delivery.otherFee) || 0,
            freeUpToKg: Number(form.delivery.freeUpToKg) || 0,
            extraKgFee: Number(form.delivery.extraKgFee) || 0,
            freeShippingThreshold: numOrNull(form.delivery.freeShippingThreshold),
          },
          codMaxTotal: Number(form.codMaxTotal) || 0,
          paymentAccounts: {
            bankName: form.paymentAccounts.bankName.trim(),
            accountTitle: form.paymentAccounts.accountTitle.trim(),
            accountNumber: form.paymentAccounts.accountNumber.trim(),
            iban: form.paymentAccounts.iban.trim(),
            jazzcashNumber: form.paymentAccounts.jazzcashNumber.trim(),
            easypaisaNumber: form.paymentAccounts.easypaisaNumber.trim(),
            raastQrUrl: form.paymentAccounts.raastQrUrl.trim(),
          },
          paymentMethods: form.paymentMethods,
          reviewRequestDays: Number(form.reviewRequestDays) || 0,
        }),
      });
      setNotice("Settings saved.");
    } catch (err) {
      setError(err.message || "Could not save settings.");
    } finally {
      setBusy(false);
    }
  };

  const addMethod = () => {
    const key = newMethodKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const label = newMethodLabel.trim();
    if (!key || !label) return;
    if (form.paymentMethods.some((m) => m.key === key)) {
      setError(`A payment method with key "${key}" already exists.`);
      return;
    }
    setForm((f) => ({ ...f, paymentMethods: [...f.paymentMethods, { key, label, enabled: true }] }));
    setNewMethodKey("");
    setNewMethodLabel("");
    setError("");
  };

  if (!loaded) return <p className="p-4 text-muted">Loading...</p>;

  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-2 font-display text-2xl font-bold text-ink">Settings</h2>
      <p className="mb-6 text-sm text-muted">
        Shop details, delivery, payments and reviews. Everything here is
        saved with one button at the bottom.
      </p>
      {notConfigured && (
        <div className={`${cardCls} mb-4 text-center`}>
          <p className="mb-2 font-display text-lg font-semibold text-ink">Database not connected</p>
          <p className="text-sm text-muted">Set MONGODB_URI to change settings here.</p>
        </div>
      )}
      <Notice kind="error">{error}</Notice>
      <Notice kind="success">{notice}</Notice>

      <form onSubmit={handleSave} className="space-y-6">
        <section className={cardCls}>
          <h3 className="mb-4 font-display text-xl font-semibold text-ink">Store</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shop name">
              <input value={form.shopName} onChange={(e) => set("shopName", e.target.value)} className={inputCls} placeholder="AI Communication" />
            </Field>
            <Field label="Tagline">
              <input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputCls} placeholder="Smart Gadgets and Gear" />
            </Field>
            <Field label="Address">
              <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} placeholder="Shahjahan Electronics Market, Saddar, Karachi" />
            </Field>
            <Field label="WhatsApp number" hint="For customer questions about an order, returns or the shop. Orders are placed on the website.">
              <input value={form.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} className={inputCls} placeholder="0335-5186552" inputMode="tel" />
            </Field>
            <Field label="Instagram">
              <input value={form.socials.instagram} onChange={(e) => setNested("socials", "instagram", e.target.value)} className={inputCls} placeholder="https://instagram.com/aicommunicationkhi" />
            </Field>
            <Field label="Facebook">
              <input value={form.socials.facebook} onChange={(e) => setNested("socials", "facebook", e.target.value)} className={inputCls} placeholder="https://facebook.com/aicommunicationkhi" />
            </Field>
            <Field label="TikTok">
              <input value={form.socials.tiktok} onChange={(e) => setNested("socials", "tiktok", e.target.value)} className={inputCls} placeholder="https://tiktok.com/@aicommunicationkhi" />
            </Field>
            <Field label="WhatsApp Community">
              <input value={form.socials.whatsappCommunity} onChange={(e) => setNested("socials", "whatsappCommunity", e.target.value)} className={inputCls} placeholder="https://chat.whatsapp.com/..." />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <UploadField label="Logo" value={form.logoUrl} onChange={(url) => set("logoUrl", url)} hint="The dark logo is used on the dark site." />
            <UploadField label="Banner" value={form.bannerUrl} onChange={(url) => set("bannerUrl", url)} hint="Used on the About page and contrast strips." />
          </div>
        </section>

        <section className={cardCls}>
          <h3 className="mb-4 font-display text-xl font-semibold text-ink">Delivery</h3>
          <p className="mb-4 text-sm text-muted">
            The fee is computed from the city and the product weight, and shown
            before payment on the product page, in the cart and at checkout.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Karachi fee (PKR)">
              <input type="number" min="0" value={form.delivery.karachiFee} onChange={(e) => setNested("delivery", "karachiFee", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Rest of Pakistan fee (PKR)">
              <input type="number" min="0" value={form.delivery.otherFee} onChange={(e) => setNested("delivery", "otherFee", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Free up to (kg)">
              <input type="number" min="0" step="0.5" value={form.delivery.freeUpToKg} onChange={(e) => setNested("delivery", "freeUpToKg", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Extra per kg (PKR)">
              <input type="number" min="0" value={form.delivery.extraKgFee} onChange={(e) => setNested("delivery", "extraKgFee", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Free shipping over (PKR, optional)" hint="Empty means no free shipping threshold.">
              <input type="number" min="0" value={form.delivery.freeShippingThreshold ?? ""} onChange={(e) => setNested("delivery", "freeShippingThreshold", e.target.value)} className={inputCls} placeholder="e.g. 10000" />
            </Field>
          </div>
        </section>

        <section className={cardCls}>
          <h3 className="mb-4 font-display text-xl font-semibold text-ink">Payment</h3>
          <div className="mb-4">
            <Field label="Cash on delivery limit (PKR)" hint="Cash on delivery is only offered up to this order total. Above it the customer pays 100 percent advance. Cash on delivery is kept only until advance payments are flowing, then it is retired.">
              <input type="number" min="0" value={form.codMaxTotal} onChange={(e) => set("codMaxTotal", e.target.value)} className={inputCls} />
            </Field>
          </div>
          <h4 className="mb-2 font-semibold text-ink">Payment methods</h4>
          {form.paymentMethods.length === 0 ? (
            <p className="mb-3 text-sm text-muted">No payment methods set. Add the first one below.</p>
          ) : (
            <ul className="mb-3 space-y-2">
              {form.paymentMethods.map((m, i) => (
                <li key={m.key + i} className="flex items-center gap-3 rounded-xl border border-line bg-raised px-3 py-2">
                  <span className="min-w-0 flex-1 text-sm text-ink">
                    <span className="font-semibold">{m.label}</span>
                    <span className="text-muted"> ({m.key})</span>
                  </span>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={!!m.enabled}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          paymentMethods: f.paymentMethods.map((x, k) =>
                            k === i ? { ...x, enabled: e.target.checked } : x
                          ),
                        }))
                      }
                      className="h-5 w-5 accent-[#FF7A1A]"
                    />
                    Enabled
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, paymentMethods: f.paymentMethods.filter((_, k) => k !== i) }))
                    }
                    className="cursor-pointer rounded-lg border border-danger/50 px-2 py-1 text-xs font-semibold text-danger"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mb-4 flex flex-wrap gap-2">
            <input
              value={newMethodKey}
              onChange={(e) => setNewMethodKey(e.target.value)}
              className={`${inputCls} min-w-36 flex-1`}
              placeholder="Key, e.g. safepay"
              aria-label="New payment method key"
            />
            <input
              value={newMethodLabel}
              onChange={(e) => setNewMethodLabel(e.target.value)}
              className={`${inputCls} min-w-36 flex-1`}
              placeholder="Label, e.g. Card via Safepay"
              aria-label="New payment method label"
            />
            <button
              type="button"
              onClick={addMethod}
              disabled={!newMethodKey.trim() || !newMethodLabel.trim()}
              className="cursor-pointer rounded-xl border border-line bg-raised px-4 py-2 font-semibold text-ink hover:border-battery disabled:opacity-60"
            >
              Add method
            </button>
          </div>
          <h4 className="mb-2 font-semibold text-ink">Payment accounts</h4>
          <p className="mb-4 rounded-xl border border-line bg-raised p-3 text-sm text-muted">
            These account details are shown ONLY after a customer places an
            order, never on public pages. Fill them in here yourself. They are
            empty until you enter them.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bank name">
              <input value={form.paymentAccounts.bankName} onChange={(e) => setNested("paymentAccounts", "bankName", e.target.value)} className={inputCls} placeholder="e.g. Meezan Bank" />
            </Field>
            <Field label="Account title">
              <input value={form.paymentAccounts.accountTitle} onChange={(e) => setNested("paymentAccounts", "accountTitle", e.target.value)} className={inputCls} placeholder="Account holder name" />
            </Field>
            <Field label="Account number">
              <input value={form.paymentAccounts.accountNumber} onChange={(e) => setNested("paymentAccounts", "accountNumber", e.target.value)} className={inputCls} placeholder="Account number" inputMode="numeric" />
            </Field>
            <Field label="IBAN">
              <input value={form.paymentAccounts.iban} onChange={(e) => setNested("paymentAccounts", "iban", e.target.value)} className={inputCls} placeholder="PK..." />
            </Field>
            <Field label="JazzCash number">
              <input value={form.paymentAccounts.jazzcashNumber} onChange={(e) => setNested("paymentAccounts", "jazzcashNumber", e.target.value)} className={inputCls} placeholder="03XX-XXXXXXX" inputMode="tel" />
            </Field>
            <Field label="Easypaisa number">
              <input value={form.paymentAccounts.easypaisaNumber} onChange={(e) => setNested("paymentAccounts", "easypaisaNumber", e.target.value)} className={inputCls} placeholder="03XX-XXXXXXX" inputMode="tel" />
            </Field>
          </div>
          <div className="mt-4">
            <UploadField
              label="Raast QR code"
              value={form.paymentAccounts.raastQrUrl}
              onChange={(url) => setNested("paymentAccounts", "raastQrUrl", url)}
              hint="Upload the Raast QR image. It is shown only after an order is placed."
            />
          </div>
        </section>

        <section className={cardCls}>
          <h3 className="mb-4 font-display text-xl font-semibold text-ink">Reviews</h3>
          <Field label="Ask for a review (days after delivery)" hint="A review request goes out on WhatsApp this many days after delivery, with a link to the review form.">
            <input
              type="number"
              min="0"
              max="30"
              value={form.reviewRequestDays}
              onChange={(e) => set("reviewRequestDays", e.target.value)}
              className={inputCls}
            />
          </Field>
        </section>

        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? "Saving..." : "Save settings"}
        </button>
      </form>
    </div>
  );
}
