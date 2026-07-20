// Server-only NOWPayments integration: create a hosted crypto invoice and
// verify the IPN webhook signature. Payout currency (BTC) and enabled coins
// (BTC, USDT-TRC20, ETH) are configured in the NOWPayments dashboard.
// Secrets: NOWPAYMENTS_API_KEY (invoice creation), NOWPAYMENTS_IPN_SECRET (IPN
// signature verification).
import { env } from "cloudflare:workers";

const NP_BASE = "https://api.nowpayments.io/v1";

function apiKey(): string {
  const k = (env as Record<string, string | undefined>).NOWPAYMENTS_API_KEY;
  if (!k) throw new Error("NOWPAYMENTS_API_KEY is not configured.");
  return k;
}

function ipnSecret(): string | undefined {
  return (env as Record<string, string | undefined>).NOWPAYMENTS_IPN_SECRET;
}

export async function createInvoice(args: {
  orderId: string;
  amountCents: number;
  description: string;
  ipnUrl: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ invoiceId: string; invoiceUrl: string }> {
  const res = await fetch(`${NP_BASE}/invoice`, {
    method: "POST",
    headers: { "x-api-key": apiKey(), "Content-Type": "application/json" },
    body: JSON.stringify({
      price_amount: Number((args.amountCents / 100).toFixed(2)),
      price_currency: "usd",
      order_id: args.orderId,
      order_description: args.description,
      ipn_callback_url: args.ipnUrl,
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
    }),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || !json.id) {
    throw new Error(
      `NOWPayments invoice failed (${res.status}): ${JSON.stringify(json).slice(0, 300)}`,
    );
  }
  return { invoiceId: String(json.id), invoiceUrl: String(json.invoice_url) };
}

// ---- Status lookups (used by the reconciliation job) ----
// The webhook is the fast path; these let us confirm payment state even if a
// callback is never delivered.

async function npGet(path: string): Promise<any | null> {
  const res = await fetch(`${NP_BASE}${path}`, {
    method: "GET",
    headers: { "x-api-key": apiKey() },
  });
  if (!res.ok) return null;
  return await res.json().catch(() => null);
}

// Precise lookup — only possible once we've learned a payment_id.
export async function getPaymentById(paymentId: string): Promise<any | null> {
  return await npGet(`/payment/${encodeURIComponent(paymentId)}`);
}

// Fallback for orders where no callback ever arrived, so we have no
// payment_id: list recent payments and match on order_id (we set order_id to
// our own order id at invoice creation).
export async function listRecentPayments(limit = 100): Promise<any[]> {
  const json = await npGet(`/payment/?limit=${limit}&page=0&sortBy=created_at&orderBy=desc`);
  if (!json) return [];
  const list = json.data ?? json.result ?? json.payments ?? [];
  return Array.isArray(list) ? list : [];
}

// NOWPayments signs the IPN body with HMAC-SHA512 over the JSON with keys
// sorted alphabetically (recursively), keyed by the IPN secret. Compare against
// the `x-nowpayments-sig` header.
function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortDeep((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyIpnSignature(
  rawBody: string,
  signature: string | null,
): Promise<{ ok: boolean; payload: any }> {
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return { ok: false, payload: null };
  }
  const secret = ipnSecret();
  if (!secret || !signature) return { ok: false, payload };

  const sorted = JSON.stringify(sortDeep(payload));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(sorted));
  const expected = toHex(mac);
  // Constant-time-ish compare.
  if (expected.length !== signature.length) return { ok: false, payload };
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return { ok: diff === 0, payload };
}

// Map NOWPayments payment_status to our order status.
export function mapPaymentStatus(status: string): "pending" | "paid" | "failed" | "expired" {
  switch (status) {
    case "finished":
    case "confirmed":
      return "paid";
    case "failed":
    case "refunded":
      return "failed";
    case "expired":
      return "expired";
    default:
      return "pending"; // waiting, confirming, sending, partially_paid
  }
}
