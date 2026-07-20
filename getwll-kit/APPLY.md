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

## Only difference from the aminos changes
Runtime env: these files use `process.env` (Netlify). The aminos copies use
`import { env } from "cloudflare:workers"`. Everything else is identical.
