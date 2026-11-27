"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/products";
import {
  apiJson,
  btnDanger,
  btnGhost,
  btnPrimary,
  cardCls,
  Field,
  fmtDate,
  inputCls,
  Notice,
} from "@/components/AdminUI";

const PIPELINE = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered"];
const RETURN_TYPES = [
  { value: "", label: "Choose a return type..." },
  { value: "RTO", label: "RTO (returned to origin, not delivered)" },
  { value: "Defective", label: "Defective (item faulty)" },
  { value: "ChangeOfMind", label: "Change of mind" },
];

function waLink(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `92${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [noteText, setNoteText] = useState("");
  const [returnType, setReturnType] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [slip, setSlip] = useState(null);
  const [slipBusy, setSlipBusy] = useState(false);

  const load = () => {
    setError("");
    setLoaded(false);
    fetch(`/api/admin/orders/${encodeURIComponent(id)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data?.order) {
          setError(data.error || "Could not load this order.");
          setOrder(null);
        } else {
          setOrder(data.order);
        }
      })
      .catch(() => {
        setError("Could not load this order. Check your connection.");
        setOrder(null);
      })
      .finally(() => setLoaded(true));
  };

  useEffect(load, [id]);

  const act = async (key, body, okMsg) => {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      const data = await apiJson(`/api/admin/orders/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (data.order) setOrder(data.order);
      setNotice(okMsg);
    } catch (err) {
      setError(err.message || "Could not update the order.");
    } finally {
      setBusy("");
    }
  };

  const loadSlip = async () => {
    setSlipBusy(true);
    setError("");
    try {
      const data = await apiJson(`/api/admin/orders/${encodeURIComponent(id)}/packing-slip`);
      setSlip(data.packingSlip);
    } catch (err) {
      setError(err.message || "Could not load the packing slip.");
    } finally {
      setSlipBusy(false);
    }
  };

  if (!loaded) return <p className="p-4 text-muted">Loading...</p>;

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-2 font-display text-2xl font-bold text-ink">Order</h2>
        <Notice kind="error">{error}</Notice>
        <button type="button" onClick={load} className={`${btnPrimary} mr-3`}>
          Retry
        </button>
        <Link href="/admin/orders" className="font-semibold text-battery">
          Back to Orders
        </Link>
      </div>
    );
  }

  const isAdvance = order.paymentMethod === "Advance";
  const paymentPending = order.paymentStatus === "PaymentPending";
  const currentStep = PIPELINE.indexOf(order.status);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold text-ink">
          Order {order.orderNo || order.id}
        </h2>
        <Link href="/admin/orders" className="font-semibold text-battery hover:underline">
          Back to Orders
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        Placed {fmtDate(order.createdAt)} · {order.paymentMethod || "No payment method"} ·{" "}
        {order.paymentStatus || "No payment status"} · Status: {order.status}
      </p>
      <Notice kind="error">{error}</Notice>
      <Notice kind="success">{notice}</Notice>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className={cardCls}>
            <h3 className="mb-3 font-display text-xl font-semibold text-ink">Items</h3>
            <ul className="space-y-2">
              {(order.items || []).map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-raised px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 text-ink">
                    {item.name}
                    {item.model ? ` (${item.model})` : ""} × {item.qty}
                  </span>
                  <span className="shrink-0 font-semibold text-ink">
                    {item.pricePKR != null ? formatPrice(item.pricePKR * item.qty) : "No price"}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-semibold text-ink">{order.subtotalPKR != null ? formatPrice(order.subtotalPKR) : "Not set"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery fee</dt>
                <dd className="font-semibold text-ink">{order.deliveryFeePKR != null ? formatPrice(order.deliveryFeePKR) : "Not set"}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="font-bold text-battery">{order.totalPKR != null ? formatPrice(order.totalPKR) : "Not set"}</dd>
              </div>
            </dl>
          </div>

          <div className={cardCls}>
            <h3 className="mb-3 font-display text-xl font-semibold text-ink">Customer</h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Name</dt>
                <dd className="font-semibold text-ink">{order.customer?.name || "Not set"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Phone</dt>
                <dd className="font-semibold text-ink">{order.customer?.phone || "Not set"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Address</dt>
                <dd className="text-right font-semibold text-ink">{order.customer?.address || "Not set"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">City</dt>
                <dd className="font-semibold text-ink">{order.customer?.city || "Not set"}</dd>
              </div>
            </dl>
            {order.customer?.phone && (
              <a
                href={waLink(order.customer.phone)}
                target="_blank"
                rel="noreferrer"
                className={`${btnGhost} mt-4`}
              >
                Message on WhatsApp
              </a>
            )}
            <p className="mt-2 text-xs text-muted">
              Contact only. Log what was agreed with the customer in the notes
              below.
            </p>
          </div>

          <div className={cardCls}>
            <h3 className="mb-3 font-display text-xl font-semibold text-ink">Packing slip</h3>
            <p className="mb-3 text-sm text-muted">
              The receipt for the parcel: order number, date, seller name and
              address, items, totals, payment method and customer.
            </p>
            {!slip ? (
              <button type="button" onClick={loadSlip} disabled={slipBusy} className={btnGhost}>
                {slipBusy ? "Loading..." : "View packing slip"}
              </button>
            ) : (
              <div>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-muted">Order</dt><dd className="font-semibold text-ink">{slip.orderNo}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Date</dt><dd className="font-semibold text-ink">{fmtDate(slip.date)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Seller</dt><dd className="text-right font-semibold text-ink">{slip.seller?.name}, {slip.seller?.address}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Customer</dt><dd className="text-right font-semibold text-ink">{slip.customer?.name}, {slip.customer?.phone}, {slip.customer?.address}, {slip.customer?.city}</dd></div>
                </dl>
                <ul className="mt-3 space-y-1 text-sm">
                  {(slip.items || []).map((item, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span className="text-ink">{item.description} × {item.quantity}</span>
                      <span className="font-semibold text-ink">
                        {item.lineTotalPKR != null ? formatPrice(item.lineTotalPKR) : "No price"}
                      </span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 space-y-1 border-t border-line pt-2 text-sm">
                  <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold text-ink">{slip.subtotalPKR != null ? formatPrice(slip.subtotalPKR) : "Not set"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Delivery fee</dt><dd className="font-semibold text-ink">{slip.deliveryFeePKR != null ? formatPrice(slip.deliveryFeePKR) : "Not set"}</dd></div>
                  <div className="flex justify-between text-base"><dt className="font-semibold text-ink">Total</dt><dd className="font-bold text-battery">{slip.totalPKR != null ? formatPrice(slip.totalPKR) : "Not set"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Payment</dt><dd className="font-semibold text-ink">{slip.paymentMethod} ({slip.paymentStatus})</dd></div>
                </dl>
                <div className="mt-4 flex gap-3">
                  <button type="button" onClick={() => window.print()} className={btnPrimary}>
                    Print
                  </button>
                  <button type="button" onClick={() => setSlip(null)} className={btnGhost}>
                    Hide
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className={cardCls}>
            <h3 className="mb-3 font-display text-xl font-semibold text-ink">Status</h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {PIPELINE.map((s, i) => {
                const reached = currentStep >= 0 && i <= currentStep;
                const isCurrent = order.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={busy !== "" || isCurrent}
                    onClick={() => act(`status-${s}`, { action: "status", status: s }, `Order marked ${s}.`)}
                    className={`min-h-11 cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold ${
                      isCurrent
                        ? "bg-battery text-canvas"
                        : reached
                          ? "border border-battery/50 bg-battery/10 text-battery"
                          : "border border-line bg-raised text-ink hover:border-battery"
                    } disabled:opacity-60`}
                  >
                    {s}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={busy !== "" || order.status === "Cancelled"}
                onClick={() => act("status-Cancelled", { action: "status", status: "Cancelled" }, "Order cancelled.")}
                className="min-h-11 cursor-pointer rounded-xl border border-danger/50 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger disabled:opacity-60"
              >
                Cancel order
              </button>
            </div>
            <h4 className="mb-2 font-semibold text-ink">Timeline</h4>
            {(order.timeline || []).length === 0 ? (
              <p className="text-sm text-muted">No status changes recorded yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(order.timeline || []).map((t, i) => (
                  <li key={i} className="rounded-xl border border-line bg-raised px-3 py-2">
                    <span className="font-semibold text-ink">{t.status}</span>
                    <span className="text-muted"> · {fmtDate(t.at)}</span>
                    {t.note && <span className="block text-muted">{t.note}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isAdvance && (
            <div className={cardCls}>
              <h3 className="mb-3 font-display text-xl font-semibold text-ink">Advance payment</h3>
              <p className="mb-3 text-sm text-muted">
                The screenshot alone is never proof. Verify only when the
                amount appears in the bank or wallet statement, matched by
                amount, TRX ID and date.
              </p>
              <dl className="mb-3 space-y-1 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Amount to match</dt>
                  <dd className="font-bold text-battery">{order.totalPKR != null ? formatPrice(order.totalPKR) : "Not set"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">TRX ID</dt>
                  <dd className="font-semibold text-ink">{order.trxId || "Not provided"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Payment status</dt>
                  <dd className="font-semibold text-ink">{order.paymentStatus}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Receipt uploaded</dt>
                  <dd className="font-semibold text-ink">{fmtDate(order.receiptUploadedAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Payment window ends</dt>
                  <dd className="font-semibold text-ink">{fmtDate(order.paymentWindowExpiresAt)}</dd>
                </div>
                {order.paymentVerifiedAt && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Verified at</dt>
                    <dd className="font-semibold text-ink">{fmtDate(order.paymentVerifiedAt)}</dd>
                  </div>
                )}
              </dl>
              {order.receiptUrl ? (
                <a href={order.receiptUrl} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.receiptUrl}
                    alt="Payment receipt screenshot"
                    className="mb-3 max-h-96 w-full rounded-xl border border-line object-contain bg-raised"
                  />
                </a>
              ) : (
                <p className="mb-3 text-sm text-muted">No receipt screenshot uploaded yet.</p>
              )}
              {paymentPending && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busy !== ""}
                      onClick={() => act("verify", { action: "verifyPayment" }, "Payment verified. Order confirmed.")}
                      className={btnPrimary}
                    >
                      {busy === "verify" ? "Verifying..." : "Verify payment"}
                    </button>
                    <button
                      type="button"
                      disabled={busy !== ""}
                      onClick={() => act("reject", { action: "rejectPayment", note: rejectNote.trim() || undefined }, "Payment rejected.")}
                      className={btnDanger}
                    >
                      {busy === "reject" ? "Rejecting..." : "Reject payment"}
                    </button>
                  </div>
                  <Field label="Rejection note (optional)" hint="Shown to the customer. Say what to do next, for example pay again with the order number in the reference.">
                    <input
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      className={inputCls}
                      placeholder="e.g. Amount does not match the order total, please pay again"
                    />
                  </Field>
                </div>
              )}
            </div>
          )}

          <div className={cardCls}>
            <h3 className="mb-3 font-display text-xl font-semibold text-ink">Return</h3>
            {order.returnType ? (
              <p className="mb-3 text-sm text-ink">
                Return recorded: <strong>{order.returnType}</strong>
                {order.returnNotes ? `, ${order.returnNotes}` : ""}
              </p>
            ) : (
              <p className="mb-3 text-sm text-muted">No return recorded for this order.</p>
            )}
            <div className="space-y-3">
              <Field label="Return type">
                <select
                  value={returnType}
                  onChange={(e) => setReturnType(e.target.value)}
                  className={inputCls}
                >
                  {RETURN_TYPES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Return notes">
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className={inputCls}
                  placeholder="What happened, what was agreed, courier details."
                />
              </Field>
              <button
                type="button"
                disabled={busy !== "" || !returnType}
                onClick={async () => {
                  await act("return", { action: "return", returnType, returnNotes: returnNotes.trim() }, `Return recorded (${returnType}).`);
                  setReturnType("");
                  setReturnNotes("");
                }}
                className={btnPrimary}
              >
                {busy === "return" ? "Saving..." : "Record return"}
              </button>
            </div>
          </div>

          <div className={cardCls}>
            <h3 className="mb-3 font-display text-xl font-semibold text-ink">Notes</h3>
            {(order.notes || []).length === 0 ? (
              <p className="mb-3 text-sm text-muted">No notes yet. Log what was agreed with the customer here.</p>
            ) : (
              <ul className="mb-3 space-y-2 text-sm">
                {(order.notes || []).map((n, i) => (
                  <li key={i} className="rounded-xl border border-line bg-raised px-3 py-2">
                    <span className="text-ink">{n.text}</span>
                    <span className="block text-xs text-muted">
                      {n.by || "admin"} · {fmtDate(n.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="space-y-3">
              <textarea
                rows={2}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className={inputCls}
                placeholder="Add a note, for example what was agreed on the call."
              />
              <button
                type="button"
                disabled={busy !== "" || !noteText.trim()}
                onClick={async () => {
                  await act("note", { action: "note", note: noteText.trim() }, "Note added.");
                  setNoteText("");
                }}
                className={btnPrimary}
              >
                {busy === "note" ? "Adding..." : "Add note"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
