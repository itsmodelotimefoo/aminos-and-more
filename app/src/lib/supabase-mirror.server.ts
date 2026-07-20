// Best-effort mirror of orders into the shared Supabase (the Ops Hub's source
// of truth) alongside the existing D1 writes. Every function is a no-op unless
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are configured, and every call is
// wrapped so a Supabase hiccup can NEVER break checkout or the IPN webhook.
//
// Secrets (set via wrangler secret / dashboard, NEVER in the client):
//   SUPABASE_URL                 e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    service-role key (bypasses RLS, server-only)
//   STORE_SLUG                   this brand's slug in the `stores` table
//                                (defaults to "aminos"; set "getwll" on that store)
import { env } from "cloudflare:workers";
import type { CartLine } from "./checkout";

function cfg() {
  const e = env as Record<string, string | undefined>;
  const url = e.SUPABASE_URL;
  const key = e.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key, store: e.STORE_SLUG || "aminos" };
}

async function rest(path: string, init: RequestInit & { headers?: Record<string, string> }) {
  const c = cfg();
  if (!c) return; // not configured → silent no-op
  try {
    const res = await fetch(`${c.url}/rest/v1${path}`, {
      ...init,
      headers: {
        apikey: c.key,
        Authorization: `Bearer ${c.key}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
    if (!res.ok) {
      console.error("supabase mirror failed", res.status, (await res.text()).slice(0, 200));
    }
  } catch (e) {
    console.error("supabase mirror error", e);
  }
}

export type MirrorOrder = {
  id: string;
  email: string;
  items: CartLine[];
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  certified21: boolean;
  certifiedResearcher: boolean;
  ship: {
    name: string; street1: string; street2: string; city: string;
    state: string; zip: string; country: string; phone: string;
  };
  shippoRateId: string;
  carrier: string;
  service: string;
  npInvoiceId?: string | null;
};

// Upsert the full order (merge on the `id` primary key) so re-runs are safe.
export async function mirrorUpsertOrder(o: MirrorOrder): Promise<void> {
  const c = cfg();
  if (!c) return;
  await rest("/orders?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: o.id,
      store_slug: c.store,
      status: "pending",
      email: o.email,
      items: o.items,
      subtotal_cents: o.subtotalCents,
      shipping_cents: o.shippingCents,
      tax_cents: o.taxCents,
      total_cents: o.totalCents,
      certified_21: o.certified21,
      certified_researcher: o.certifiedResearcher,
      ship_name: o.ship.name,
      ship_street1: o.ship.street1,
      ship_street2: o.ship.street2,
      ship_city: o.ship.city,
      ship_state: o.ship.state,
      ship_zip: o.ship.zip,
      ship_country: o.ship.country,
      ship_phone: o.ship.phone,
      shippo_rate_id: o.shippoRateId,
      ship_carrier: o.carrier,
      ship_service: o.service,
      np_invoice_id: o.npInvoiceId ?? null,
    }),
  });
}

export async function mirrorPayment(
  orderId: string,
  f: { status: string; npPaymentId?: string | null; npPaymentStatus?: string | null; payCurrency?: string | null },
): Promise<void> {
  const patch: Record<string, unknown> = { status: f.status };
  if (f.npPaymentId != null) patch.np_payment_id = f.npPaymentId;
  if (f.npPaymentStatus != null) patch.np_payment_status = f.npPaymentStatus;
  if (f.payCurrency != null) patch.pay_currency = f.payCurrency;
  await rest(`/orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(patch),
  });
}

export async function mirrorFulfillment(
  orderId: string,
  f: { carrier: string; tracking: string; labelUrl: string },
): Promise<void> {
  await rest(`/orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      status: "fulfilled",
      tracking_carrier: f.carrier,
      tracking_number: f.tracking,
      label_url: f.labelUrl,
    }),
  });
}
