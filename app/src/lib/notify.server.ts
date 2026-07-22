// Back-in-stock signups. When a size is sold out a customer can leave their
// email; it's stored in the shared Supabase `stock_notify` table (the Ops Hub's
// source of truth) so you can email them when it's restocked.
//
// Same guarded pattern as the order mirror: a no-op unless SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY are set, and every call is wrapped so a Supabase
// hiccup can never throw into the page. Returns { ok } so the UI knows whether
// the signup was actually saved (it only promises an email when it was).
//
// Secrets (server-only): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STORE_SLUG.
import { env } from "cloudflare:workers";

function cfg() {
  const e = env as Record<string, string | undefined>;
  const url = e.SUPABASE_URL;
  const key = e.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key, store: e.STORE_SLUG || "aminos" };
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function notifyBackInStock(input: {
  slug: string;
  size: string;
  email: string;
}): Promise<{ ok: boolean }> {
  const slug = (input.slug || "").trim().slice(0, 120);
  const size = (input.size || "").trim().slice(0, 60);
  const email = (input.email || "").trim().toLowerCase().slice(0, 200);
  if (!slug || !size || !EMAIL_RE.test(email)) return { ok: false };
  const c = cfg();
  if (!c) return { ok: false }; // not configured → can't honestly promise an email
  try {
    // Upsert on (slug,size,email) so a repeat signup is idempotent and re-arms
    // notified=false if they were previously emailed.
    const res = await fetch(`${c.url}/rest/v1/stock_notify?on_conflict=slug,size,email`, {
      method: "POST",
      headers: {
        apikey: c.key,
        Authorization: `Bearer ${c.key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ slug, size, email, store_slug: c.store, notified: false }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
