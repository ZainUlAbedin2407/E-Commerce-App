"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/products";

// Advance payment panel: fetches GET /api/orders/[id]/payment-details
// and shows the shop bank account, JazzCash and Easypaisa numbers and
// Raast QR, only after the order is placed, never on a public page.
// Then the receipt upload form: receipt screenshot via the guest
// receipt endpoint POST /api/orders/[id]/receipt plus TRX ID,
// POST /api/orders/[id]/payment-proof, with plain status messages
// for 200, 404, 409 and 410.
export default function PaymentDetails({ orderNo, totalPKR }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trxId, setTrxId] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [proofMsg, setProofMsg] = useState("");
  const [proofDone, setProofDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${encodeURIComponent(orderNo)}/payment-details`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, status: r.status, d })))
      .then(({ ok, d }) => {
        if (ok) setDetails(d);
        else setError(d.error || "Payment details could not be loaded.");
      })
      .catch(() => setError("Could not reach the server."))
      .finally(() => setLoading(false));
  }, [orderNo]);

  const uploadReceipt = async (file) => {
    setUploading(true);
    setProofMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(
        `/api/orders/${encodeURIComponent(orderNo)}/receipt`,
        { method: "POST", body: fd }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProofMsg(
          data.error ||
            "Receipt upload is not available right now. Try again, or contact us with your order number and TRX ID."
        );
        return;
      }
      setReceiptUrl(data.url);
      setProofMsg("Receipt uploaded. Now add the transaction ID and submit.");
    } catch {
      setProofMsg("Receipt upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const submitProof = async (e) => {
    e.preventDefault();
    setProofMsg("");
    if (!trxId.trim()) {
      setProofMsg("Enter the transaction ID from your payment.");
      return;
    }
    if (!receiptUrl) {
      setProofMsg("Upload the payment receipt screenshot first.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(orderNo)}/payment-proof`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trxId: trxId.trim(), receiptUrl }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.status === 200) {
        setProofDone(true);
        setProofMsg(
          "Receipt received. We will verify the amount in our statement and confirm your order. Dispatch starts after verification."
        );
        return;
      }
      if (res.status === 409) {
        setProofMsg("This transaction ID was already used for another order. Check the TRX ID and try again.");
        return;
      }
      if (res.status === 410) {
        setProofMsg("The 24 hour payment window for this order has expired, and the order was cancelled. Please place a new order.");
        return;
      }
      if (res.status === 404) {
        setProofMsg("Order not found. Check the order number and try again.");
        return;
      }
      setProofMsg(data.error || "Could not submit the receipt. Try again.");
    } catch {
      setProofMsg("Could not reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="skeleton h-40 rounded-2xl" />;

  if (error || !details) {
    return (
      <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-muted">
        {error || "Payment details are not available for this order."}
      </p>
    );
  }

  const a = details.accounts || {};
  const anyAccount = a.bankName || a.accountNumber || a.iban || a.jazzcashNumber || a.easypaisaNumber || a.raastQrUrl;
  const expires = details.paymentWindowExpiresAt
    ? new Date(details.paymentWindowExpiresAt).toLocaleString()
    : "";

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <h3 className="font-display text-lg font-bold text-ink">Pay in advance</h3>
      <p className="mt-2 text-sm text-muted">
        Pay exactly{" "}
        <span className="font-semibold text-battery">
          {formatPrice(details.totalPKR ?? totalPKR)}
        </span>{" "}
        and put your order number{" "}
        <span className="font-semibold text-ink">{details.orderNo}</span> in the
        transfer reference. Payment status: {details.paymentStatus}.
        {expires ? ` Pay within 24 hours, by ${expires}.` : ""}
      </p>

      {!anyAccount ? (
        <p className="mt-4 rounded-xl bg-raised p-4 text-sm text-ink">
          Payment details are being set up. We will share the bank account and
          wallet numbers for this order shortly, contact us with your order number.
        </p>
      ) : (
        <div className="mt-4 space-y-3 text-sm">
          {(a.bankName || a.accountTitle || a.accountNumber || a.iban) && (
            <div className="rounded-xl bg-raised p-4">
              <p className="font-semibold text-ink">Bank transfer</p>
              {a.bankName && <p className="text-muted">Bank: {a.bankName}</p>}
              {a.accountTitle && <p className="text-muted">Account title: {a.accountTitle}</p>}
              {a.accountNumber && <p className="text-muted">Account number: {a.accountNumber}</p>}
              {a.iban && <p className="text-muted">IBAN: {a.iban}</p>}
            </div>
          )}
          {a.jazzcashNumber && (
            <div className="rounded-xl bg-raised p-4">
              <p className="font-semibold text-ink">JazzCash</p>
              <p className="text-muted">{a.jazzcashNumber}</p>
            </div>
          )}
          {a.easypaisaNumber && (
            <div className="rounded-xl bg-raised p-4">
              <p className="font-semibold text-ink">Easypaisa</p>
              <p className="text-muted">{a.easypaisaNumber}</p>
            </div>
          )}
          {a.raastQrUrl && (
            <div className="rounded-xl bg-raised p-4">
              <p className="mb-2 font-semibold text-ink">Raast QR</p>
              <Image src={a.raastQrUrl} alt="Raast QR code for payment" width={180} height={180} className="h-44 w-44 rounded-lg bg-raised object-cover" />
            </div>
          )}
        </div>
      )}

      {!proofDone && (
        <form onSubmit={submitProof} noValidate className="mt-5 border-t border-line pt-5">
          <h4 className="font-semibold text-ink">Upload your payment receipt</h4>
          <p className="mt-1 text-sm text-muted">
            Pay first, then upload the receipt screenshot and the transaction
            ID (TRX ID). The screenshot alone is not proof, we match the
            amount, the TRX ID and the date in our own statement before dispatch.
          </p>
          <div className="mt-4">
            <label htmlFor="receipt" className="mb-1 block text-sm font-semibold text-ink">
              Receipt screenshot
            </label>
            <input
              id="receipt"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadReceipt(f);
              }}
              className="block w-full rounded-xl border border-line bg-raised p-3 text-sm text-ink"
            />
            {uploading && <p className="mt-1 text-sm text-muted">Uploading…</p>}
            {receiptUrl && <p className="mt-1 text-sm text-success">Receipt uploaded.</p>}
          </div>
          <div className="mt-4">
            <label htmlFor="trxid" className="mb-1 block text-sm font-semibold text-ink">
              Transaction ID (TRX ID)
            </label>
            <input
              id="trxid"
              type="text"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              className="w-full rounded-xl border border-line bg-raised p-3 text-base text-ink placeholder:text-muted"
              placeholder="Enter the TRX ID from your payment"
            />
          </div>
          {proofMsg && <p className="mt-3 text-sm font-medium text-ink">{proofMsg}</p>}
          <button
            type="submit"
            disabled={submitting || uploading}
            className="press mt-4 inline-flex min-h-12 items-center rounded-full bg-battery px-8 py-3 font-semibold text-canvas hover:bg-battery-deep disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit receipt"}
          </button>
        </form>
      )}
      {proofDone && proofMsg && (
        <p className="mt-4 rounded-xl bg-raised p-4 text-sm font-medium text-success">{proofMsg}</p>
      )}
    </div>
  );
}
