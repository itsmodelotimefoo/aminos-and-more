// Supabase Edge Function: stock-notify
// ---------------------------------------------------------------------------
// Closes the back-in-stock loop automatically. On each run it:
//   1. finds sizes that are back in stock (size_stock.on_hand > 0),
//   2. matches them against open signups (stock_notify.notified = false),
//   3. emails each waiter (via Resend), and
//   4. flips notified = true — but ONLY for signups whose email actually sent,
//      so a transient email failure is simply retried on the next run.
//
// Idempotent and safe to run on a schedule (see README.md). No external deps —
// it talks to PostgREST and Resend over fetch. If RESEND_API_KEY is not set it
// runs "dry" (reports who WOULD be emailed and flips nothing), so you can wire
// it up and watch before turning email on.
//
// Env (supabase secrets set …):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   auto-injected by the platform
//   RESEND_API_KEY        Resend API key (unset → dry run)
//   NOTIFY_FROM           From header, e.g. "Aminos & More <noreply@aminosandmore.com>"
//   NOTIFY_CRON_SECRET    optional shared secret; when set, callers must send
//                         header  x-cron-secret: <value>  (use with --no-verify-jwt)

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") ?? "Aminos & More <onboarding@resend.dev>";
const CRON_SECRET = Deno.env.get("NOTIFY_CRON_SECRET") ?? "";

// Per-brand From address. A signup's `store_slug` selects the sender via
// NOTIFY_FROM_<SLUG> (slug upper-cased, non-alphanumerics → underscore), e.g.
// store_slug "getwll" → NOTIFY_FROM_GETWLL, "aminos" → NOTIFY_FROM_AMINOS.
// Falls back to NOTIFY_FROM when the brand-specific var isn't set, so each
// brand's waiters are emailed from its own address once you set it.
function fromFor(storeSlug: string): string {
  const key = "NOTIFY_FROM_" + storeSlug.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  return Deno.env.get(key) || NOTIFY_FROM;
}

type Json = Record<string, unknown>;

function rest(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

async function getJson(path: string): Promise<Json[]> {
  const res = await rest(path);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as Json[];
}

async function sendEmail(to: string, subject: string, html: string, from: string): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  return res.ok;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  );
}

function emailHtml(product: string, size: string, storeName: string, url: string): string {
  const cta = url
    ? `<p style="margin:20px 0"><a href="${url}" style="display:inline-block;background:#c9a24b;color:#1a1408;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:6px">Shop ${escapeHtml(product)} →</a></p>`
    : "";
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
    <h2 style="margin:0 0 8px;font-size:20px">${escapeHtml(product)} ${escapeHtml(size)} is back in stock</h2>
    <p style="color:#555;margin:0 0 4px;line-height:1.5">Good news — the size you asked about at ${escapeHtml(storeName)} is available again. Stock can move quickly.</p>
    ${cta}
    <p style="color:#999;font-size:12px;margin-top:24px;line-height:1.5">You're receiving this because you asked to be notified when this size returned. For research use only. 21+.</p>
  </div>`;
}

Deno.serve(async (req: Request) => {
  // Shared-secret guard (for --no-verify-jwt deploys called by pg_cron).
  if (CRON_SECRET && req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json({ ok: false, error: "missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" }, 500);
  }

  const dryRun = !RESEND_API_KEY;
  try {
    // 1. sizes back in stock
    const restocked = await getJson(`/size_stock?select=slug,size&on_hand=gt.0`);
    const backSet = new Set(restocked.map((r) => `${r.slug}\n${r.size}`));
    if (backSet.size === 0) {
      return json({ ok: true, checked: 0, matched: 0, sent: 0, note: "no sizes in stock" });
    }

    // 2. open signups whose size just came back
    const open = await getJson(`/stock_notify?select=id,slug,size,email,store_slug&notified=eq.false`);
    const matched = open.filter((w) => backSet.has(`${w.slug}\n${w.size}`));
    if (matched.length === 0) {
      return json({ ok: true, checked: open.length, matched: 0, sent: 0 });
    }

    // lookups for the email copy
    const products = await getJson(`/products?select=slug,name`);
    const nameBySlug: Record<string, string> = {};
    for (const p of products) nameBySlug[p.slug as string] = (p.name as string) || (p.slug as string);
    const stores = await getJson(`/stores?select=slug,name,domain`);
    const storeBySlug: Record<string, { name: string; domain: string }> = {};
    for (const s of stores) {
      storeBySlug[s.slug as string] = { name: (s.name as string) || "", domain: (s.domain as string) || "" };
    }

    // 3. send
    const sentIds: number[] = [];
    const wouldSend: Array<{ id: unknown; email: string; slug: string; size: string }> = [];
    const failed: Array<{ id: unknown; reason: string }> = [];
    for (const w of matched) {
      const slug = String(w.slug);
      const size = String(w.size);
      const product = nameBySlug[slug] || slug;
      const store = storeBySlug[String(w.store_slug ?? "")] || { name: "our store", domain: "" };
      const url = store.domain ? `https://${store.domain}/products/${slug}` : "";
      if (dryRun) {
        wouldSend.push({ id: w.id, email: String(w.email), slug, size });
        continue;
      }
      try {
        const ok = await sendEmail(
          String(w.email),
          `Back in stock: ${product} ${size}`,
          emailHtml(product, size, store.name, url),
          fromFor(String(w.store_slug ?? "")),
        );
        if (ok) sentIds.push(w.id as number);
        else failed.push({ id: w.id, reason: "resend send failed" });
      } catch (e) {
        failed.push({ id: w.id, reason: String(e) });
      }
    }

    // 4. mark the ones that actually sent
    if (sentIds.length) {
      const inList = sentIds.map((id) => String(id)).join(",");
      const res = await rest(`/stock_notify?id=in.(${inList})`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ notified: true }),
      });
      if (!res.ok) throw new Error(`PATCH notified → ${res.status} ${(await res.text()).slice(0, 200)}`);
    }

    return json({
      ok: true,
      checked: open.length,
      matched: matched.length,
      sent: sentIds.length,
      failed,
      dryRun,
      ...(dryRun ? { wouldSend } : {}),
    });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
