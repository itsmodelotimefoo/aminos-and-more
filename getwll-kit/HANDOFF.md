# getWLL handoff — per-size stock + back-in-stock notify

Context for the session working on `itsmodelotimefoo/getwll`. Since we last synced,
the **aminos side + shared Supabase backend** grew a full per-size stock system.
Most of it is **multi-brand already** and needs nothing from you — this note says
what's automatic vs. what the getWLL storefront still has to wire.

Everything is keyed by `store_slug`, and the shared inventory model means
`size_stock` is brand-agnostic (a size sold out is sold out for both brands —
that's the shared-inventory design). getWLL only needs to *read* per-size stock
and *write* notify signups; the Hub, the emails, and all reporting are shared.

---

## Already done for you (shared backend — zero getWLL work)

- **Tables** (`db/schema.sql`, ops-hub): `size_stock (slug,size,on_hand)` and
  `stock_notify (slug,size,email,store_slug,notified,…)`. Shared DB — if the
  aminos setup already ran the schema, these exist; nothing to re-run.
- **Ops Hub** (`hub/`): **Stock by size** editor, **Waitlist** view, dashboard
  cards (sold-out / low / waiting), and Restock "sizes to reorder" — all filter
  by `store_slug`, so getWLL rows show up automatically once they exist.
- **Auto-notify edge function** (`supabase/functions/stock-notify`): emails
  waiters when their size is back and flips `notified`. **Multi-brand:** it sends
  getWLL waiters from `NOTIFY_FROM_GETWLL` and links to `getwll.com` via
  `stores.domain`. No getWLL code needed — it already handles `store_slug='getwll'`.

## What getWLL still has to wire (storefront only)

Two additions, both mirroring aminos on the **`headless-catalog`** branch, adapted
to **Netlify `process.env`** (same pattern as the kit's existing files):

### 1. Per-size gating (read `size_stock`)
Reference (aminos): `app/src/lib/catalog.server.ts` → `getSizeStock()`, exposed via
`app/src/lib/api/catalog.functions.ts` → `loadSizeStock`, consumed in
`app/src/routes/products.$slug.tsx` (loader adds `sizeStock`; `availFor(label)`
gates each size; sold-out sizes disable Add-to-cart; low ≤10 shows the urgency
line; first in-stock size auto-selected).
- Port `getSizeStock()` into getWLL's `catalog.server.ts` using `process.env`
  (opt-in behind `SIZE_STOCK=1`; `{}` on flag-off/error → today's behavior).
- `size_stock` is brand-agnostic — read it by `(slug,size)`, no per-brand merge.

### 2. Back-in-stock "notify me" (write `stock_notify`)
Reference (aminos): `app/src/lib/notify.server.ts` + `app/src/lib/api/notify.functions.ts`
+ the `NotifyForm` component in `products.$slug.tsx` (shows on a sold-out size,
POSTs `{slug,size,email}`, confirms only when saved).
- Port `notify.server.ts` using `process.env`; it stamps `store_slug` from
  `STORE_SLUG` — which the kit already sets to **`getwll`**, so signups are
  attributed correctly and emails send from getWLL.

## Shared one-time setup (coordinate — don't double-run)

- **SQL:** `db/schema.sql` (size_stock + stock_notify). Shared DB → run once total.
  Optional `db/size_stock.seed.sql` seeds low/out sizes from current stock.
- **Storefront env (Netlify):** `SIZE_STOCK=1`, plus the Supabase creds the order
  mirror already uses (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STORE_SLUG=getwll`).
- **Edge function secrets:** add `NOTIFY_FROM_GETWLL="getWLL <noreply@getwll.com>"`
  and verify **getwll.com** in Resend. (See `supabase/functions/stock-notify/README.md`.)

## Branches
- Shared backend + Hub + edge fn + schema: **`ops-hub`** (this repo).
- Aminos storefront reference to port from: **`headless-catalog`** (this repo).
- getWLL app changes go in the **getwll** repo, adapting the above to `process.env`.

Ping if you want the Netlify-adapted `catalog.server.ts` (with `getSizeStock`) and
`notify.server.ts` dropped straight into `getwll-kit/lib/` — quick to generate.
