# getWLL integration kit

Wires getWLL into the shared Ops Hub — same two changes as aminos, adapted for
Netlify. getWLL is a re-skin of the aminos TanStack Start app, so the file paths
below should match. **Nothing changes for customers until you set the env vars.**

Copy `getwll-kit/lib/*` into getWLL's `app/src/lib/` (matching paths).

---

## Phase 1 — getWLL orders flow into the Hub  ✅ ready

This is the important one: every getWLL order shows up in the Hub tagged
**getWLL**, so fulfillment knows which labels/packaging to ship.

### 1. Drop in the file
`app/src/lib/supabase-mirror.server.ts`  ← from this kit (reads `process.env`).

### 2. Wire checkout — `app/src/routes/api.checkout.create.ts`
Add the import:
```ts
import { mirrorUpsertOrder } from "../lib/supabase-mirror.server";
```
Right after `await setInvoiceId(orderId, invoice.invoiceId);`, add:
```ts
// Mirror into the shared Supabase (Ops Hub). Best-effort, guarded.
await mirrorUpsertOrder({
  id: orderId, email: d.email, items: priced,
  subtotalCents: subtotal, shippingCents: d.shippingCents, taxCents: tax, totalCents: total,
  certified21: d.certified21, certifiedResearcher: d.certifiedResearcher,
  ship: {
    name: d.address.name, street1: d.address.street1, street2: d.address.street2 ?? "",
    city: d.address.city, state: d.address.state, zip: d.address.zip,
    country: d.address.country, phone: d.address.phone ?? "",
  },
  shippoRateId: d.shippoRateId, carrier: d.carrier, service: d.service,
  npInvoiceId: invoice.invoiceId,
});
```

### 3. Wire the payment webhook — `app/src/routes/api.ipn.ts`
Add the import:
```ts
import { mirrorPayment, mirrorFulfillment } from "../lib/supabase-mirror.server";
```
After the existing `await updatePayment(orderId, { ... });` add the same call to
`mirrorPayment(orderId, { status: mapped, npPaymentId: ..., npPaymentStatus: ..., payCurrency: ... })`
(same arguments you passed to `updatePayment`).
After `await setFulfillment(orderId, { carrier, tracking, labelUrl });` add:
```ts
await mirrorFulfillment(orderId, { carrier: label.carrier || order.ship_carrier || "", tracking: label.tracking, labelUrl: label.labelUrl });
```

### 4. Set env in Netlify → Site settings → Environment variables
```
SUPABASE_URL=https://YOUR-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role key>   # secret, server-side only
STORE_SLUG=getwll
```
Deploy. Done — getWLL orders now appear in the Hub, tagged **getWLL**, and flow
through To-Ship / Payments alongside aminos. (No env set = complete no-op, so
deploying before that is safe.)

---

## Phase 2 — Hub controls getWLL's catalog  (needs per-brand prices first)

getWLL prices/packaging differ from aminos, so its catalog reads the shared
`products` **plus getWLL's per-brand overrides** in `store_products`.

1. **Seed getWLL's prices** into `store_products` (store_slug='getwll') — generate
   this from getWLL's `products.ts` the same way `db/catalog.sql` was made for
   aminos (send me getWLL's `products.ts`, or run the generator against it).
2. Drop in `app/src/lib/catalog.server.ts` + `app/src/lib/api/catalog.functions.ts`.
3. Add loaders to `index.tsx`, `catalog.tsx`, `products.$slug.tsx`:
   ```ts
   import { loadCatalog } from "../lib/api/catalog.functions";
   // in createFileRoute(...):
   loader: async () => ({ products: await loadCatalog() }),
   // in the component: const { products } = Route.useLoaderData();
   ```
   (replace the `PRODUCTS` static import usage with `products`.)
4. Point checkout re-pricing + `sitemap[.]xml.ts` at `getCatalog()` (same as aminos).
5. **Only after** getWLL prices are seeded, set `CATALOG_FROM_DB=1` in Netlify —
   otherwise getWLL would render base (aminos) prices. Unset to instantly revert.

---

## Phase 3 — per-size stock gating + back-in-stock notify  ✅ ready

Gates each **size** on the storefront (sold out at 0, low nudge ≤10) and lets a
customer sign up to be emailed when a sold-out size returns. `size_stock` is
brand-agnostic (shared inventory), and the Hub + auto-notify emails are already
multi-brand — so getWLL only wires the storefront read + the signup write.

### 1. Files are in this kit (already updated)
- `app/src/lib/catalog.server.ts` — now also exports `getStock()` + `getSizeStock()`.
- `app/src/lib/api/catalog.functions.ts` — now also exports `loadStock` + `loadSizeStock`.
- `app/src/lib/notify.server.ts`  ← new (reads `process.env`, tags `store_slug=getwll`).
- `app/src/lib/api/notify.functions.ts`  ← new (`requestBackInStock` server fn; needs `zod`).

Re-copy the two catalog files (they gained exports) and drop in the two notify files.

### 2. Wire the PDP — `app/src/routes/products.$slug.tsx`
Mirror the aminos PDP on the **`headless-catalog`** branch (copy its body — it's a
re-skin so it matches). The moving parts:
```ts
import { loadCatalog, loadStock, loadSizeStock } from "../lib/api/catalog.functions";
import { requestBackInStock } from "../lib/api/notify.functions";
// loader:
loader: async () => ({ products: await loadCatalog(), stock: await loadStock(), sizeStock: await loadSizeStock() }),
```
Then, in the component (verbatim from aminos):
- `availFor(label)` = per-size level (`sizeStock[slug]`) or product-level `stock[slug]`;
- disable Add-to-cart when the selected size is sold out; show the low-stock line ≤10;
- a `useEffect` that auto-selects the first in-stock size;
- the `NotifyForm` shown when the selected size is sold out (POSTs `requestBackInStock`).

### 3. Env in Netlify
```
SIZE_STOCK=1          # turns on per-size gating (needs CATALOG_FROM_DB=1 from Phase 2)
```
(Supabase creds + `STORE_SLUG=getwll` are already set from Phase 1.) Unset
`SIZE_STOCK` to instantly revert to product-level behavior.

### 4. Shared backend — nothing to build
Already live for both brands (in the aminos repo, `ops-hub`): the `size_stock` +
`stock_notify` tables, the Hub's **Stock by size** / **Waitlist** / dashboard
cards, and the **stock-notify edge function** that emails getWLL waiters from
`NOTIFY_FROM_GETWLL` and links to `getwll.com`. Just make sure the shared setup
ran once (schema + the `NOTIFY_FROM_GETWLL` secret + `getwll.com` verified in
Resend — see `supabase/functions/stock-notify/README.md`).

---

## Only difference from the aminos changes
Runtime env: these files use `process.env` (Netlify). The aminos copies use
`import { env } from "cloudflare:workers"`. Everything else is identical.
