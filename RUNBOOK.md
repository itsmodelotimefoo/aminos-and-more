# Ops Hub — multi-brand order operations

A private back office that shows **every order across all your storefront brands
in one place**, each tagged with the brand so fulfillment knows which labels /
packaging to ship, on top of shared Supabase, Shippo, NOWPayments and inventory —
extensible to more stores.

This lives on the **`ops-hub`** branch and is deliberately isolated: it deploys as
its own Cloudflare Worker on its own domain and never shares a deploy with any
storefront (which is what caused the earlier incident).

## What's in this branch
```
db/schema.sql              shared Postgres schema + Row Level Security
db/seed.sql                the two brands + shared catalog/inventory (edit before live)
hub/                       the Ops Hub PWA (static, no build) — deploy as worker "ops-hub"
app/src/lib/supabase-mirror.server.ts   guarded dual-write from the aminos store → Supabase
app/src/routes/api.checkout.create.ts   wired to mirror new orders (guarded)
app/src/routes/api.ipn.ts               wired to mirror payment + fulfillment (guarded)
```

The dual-write is a **no-op until you set the Supabase env vars**, and every mirror
call is wrapped so it can never fail a checkout or IPN webhook.

## Architecture
- **Supabase (Postgres)** = single source of truth. Multi-tenant by `store_slug`;
  every order carries its brand.
- **Storefronts write orders to Supabase** with the **service-role** key (server-side,
  bypasses RLS), stamped with `STORE_SLUG`. They keep their existing D1/DB too
  (dual-write) until you're ready to cut over.
- **The Hub reads** with the **anon** key + a staff login. Order data is private
  because of RLS + the `staff` allowlist — the anon key is safe to ship.

---

## Go-live (Phase 1 — Aminos & More)

### 1. Supabase
1. Use your existing Supabase project (or create one).
2. In the SQL editor, run **`db/schema.sql`**, then **`db/seed.sql`**.
   Edit the seed's brand names, packaging and prices to match reality first.
3. Create your staff login: Dashboard → **Authentication → Users → Add user**
   (email + password). Copy that user's UUID, then in the SQL editor:
   ```sql
   insert into staff (user_id, email) values ('<user-uuid>', 'you@company.com');
   ```
4. Grab **Project URL**, **anon key**, and **service-role key**
   (Settings → API).

### 2. Deploy the Hub
1. Create your config (git-ignored, so keys never get committed) and fill in the
   **URL + anon key**:
   ```bash
   cd hub && cp config.example.js config.js   # then edit config.js
   ```
2. Deploy as its own worker on its own subdomain (e.g. `ops.yourdomain.com`):
   ```bash
   cd hub && npx wrangler deploy
   ```
   (or connect a **new** Cloudflare project with Root directory `hub`).
3. Open it, sign in with the staff account. Add it to your iPhone home screen
   (Share → Add to Home Screen) — it runs full-screen and works offline for reads.

### 3. Turn on the store's dual-write (Aminos & More / Cloudflare)
On the `aminos-and-more` worker, set secrets (never commit these):
```bash
npx wrangler secret put SUPABASE_URL              # https://xxxx.supabase.co
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY # service-role key
npx wrangler secret put STORE_SLUG                # aminos
```
Then merge the `app/` dual-write changes from this branch into the store's deploy
branch and deploy. New orders now appear in the Hub, tagged **Aminos & More**.
> Nothing breaks if you skip this — without the secrets the mirror is a no-op.

---

## Phase 2 — add getWLL (Netlify)
getwll.com is a separate deploy on Netlify from a different repo. To bring it in:
1. Add the same `supabase-mirror` write to that store's checkout + payment webhook
   (share me the repo and I'll wire it identically).
2. Set the same Supabase env vars on Netlify with **`STORE_SLUG=getwll`**.
Both brands then flow into one Hub, each correctly tagged.

## Adding more stores later
1. `insert into stores (slug, name, domain, order_prefix, label_profile) values (...)`.
2. Point the new storefront's mirror at Supabase with its own `STORE_SLUG`.
That's it — the Hub picks it up automatically (brand filter, packaging profile, etc.).

## Later phases
- Move Shippo label buying / "mark shipped" actions into the Hub.
- Decrement shared `inventory` on paid orders.
- Make Supabase primary and retire the per-store D1/DB silos.
- Ad-campaign attribution: the `orders.utm` column is ready for per-brand UTM tagging.

## Security notes
- **anon key**: public, shipped in the Hub. Safe — RLS + `staff` gate all reads.
- **service-role key**: secret, server-side only (storefront workers). Never ship it
  to a browser or commit it.
- The Hub sets `X-Robots-Tag: noindex` and is staff-authenticated.
