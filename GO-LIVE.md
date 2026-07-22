# Per-size stock — go-live checklist

Everything is built and pushed. This is the one-time setup to switch it on, in
order. Each step is safe on its own and reversible; nothing reaches customers
until **Step 2**.

Branches: storefront = `headless-catalog` · backend/Hub/edge fn = `ops-hub`.

---

## Step 1 — Database (shared Supabase)  ▢

Supabase Dashboard → SQL Editor → New query → paste → **Run**. Idempotent, so
re-running is safe. (Also in `db/schema.sql` + `db/size_stock.seed.sql`.)

```sql
-- 1a. Per-size stock
create table if not exists size_stock (
  slug text not null, size text not null,
  on_hand integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (slug, size)
);
create index if not exists size_stock_slug_idx on size_stock (slug);
alter table size_stock enable row level security;
drop policy if exists staff_all on size_stock;
create policy staff_all on size_stock for all to authenticated
  using (is_staff()) with check (is_staff());

-- 1b. Back-in-stock waitlist
create table if not exists stock_notify (
  id bigint generated always as identity primary key,
  slug text not null, size text not null, email text not null,
  store_slug text, notified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (slug, size, email)
);
create index if not exists stock_notify_open_idx on stock_notify (notified, slug, size);
alter table stock_notify enable row level security;
drop policy if exists staff_all on stock_notify;
create policy staff_all on stock_notify for all to authenticated
  using (is_staff()) with check (is_staff());

-- 1c. Seed only low/out sizes from current SKU inventory (≤10)
insert into size_stock (slug, size, on_hand)
select p.slug, (elem->>0) as size, i.on_hand
from products p
join inventory i on i.sku = p.sku,
     lateral jsonb_array_elements(p.sizes) elem
where p.slug is not null and p.active is not false
  and i.on_hand <= 10 and coalesce(elem->>0,'') <> ''
on conflict (slug, size) do nothing;

-- 1d. Confirm
select slug, size, on_hand from size_stock order by slug, size;
```

**Verify:** the `select` returns your low/out sizes. In the **Hub → Stock by size**,
the "Enable per-size stock" card is now the live editor.
**Nothing customer-facing has changed yet.**

---

## Step 2 — Turn on gating for customers (aminos)  ▢

Set the flag on the aminos Cloudflare Worker (the `headless-catalog` deploy):

```
SIZE_STOCK=1
```

Cloudflare dashboard → Worker → Settings → Variables (or `wrangler`). The
Supabase creds are already set (order mirror uses them). Also confirm
`CATALOG_FROM_DB=1` if you want the DB-driven catalog.

**Verify:** open a product with a sold-out size — the size shows **Sold out**,
Add-to-cart disables, and a **"notify me"** field appears.
**Rollback:** unset `SIZE_STOCK` → instantly back to product-level behavior.

---

## Step 3 — Auto back-in-stock emails (optional)  ▢

Runbook: `supabase/functions/stock-notify/README.md`. Requires a
[Resend](https://resend.com) account + verified sending domain.

1. **Secrets**
   ```bash
   supabase secrets set \
     RESEND_API_KEY="re_xxx" \
     NOTIFY_FROM="Aminos & More <noreply@aminosandmore.com>" \
     NOTIFY_FROM_AMINOS="Aminos & More <noreply@aminosandmore.com>" \
     NOTIFY_FROM_GETWLL="getWLL <noreply@getwll.com>" \
     NOTIFY_CRON_SECRET="$(openssl rand -hex 16)"
   ```
   Leave `RESEND_API_KEY` unset first to **dry-run** (reports who it would email,
   sends nothing).
2. **Deploy:** `supabase functions deploy stock-notify --no-verify-jwt`
3. **Schedule** (every 15 min) — the pg_cron block in the README.
4. **Verify:** `curl` the function (README) → `{ ok, matched, sent }`.

**Rollback:** `select cron.unschedule('stock-notify-every-15m');`

---

## The loop, once live

Sold-out size → customer taps **notify me** → row in `stock_notify` → you see it
in **Hub → Waitlist** (+ dashboard card) → restock in **Stock by size / Restock** →
edge function emails waiters + clears them → storefront un-gates the size.

---

## getWLL (parallel, that session owns it)

Same backend, no new infra — see `getwll-kit/HANDOFF.md` + `getwll-kit/APPLY.md`
(Phase 3). getWLL just copies the kit's storefront files and sets `SIZE_STOCK=1`
in Netlify. Step 1's tables are shared (already done); Step 3 already emails
getWLL waiters from `NOTIFY_FROM_GETWLL`.

## What I can't do from here
Applying the SQL, setting Worker/Netlify env, and deploying the edge function all
need dashboard/CLI access this session can't reach (the Supabase connector is
approval-gated in non-interactive mode). Every artifact above is committed and
ready — these three steps are yours to run.
