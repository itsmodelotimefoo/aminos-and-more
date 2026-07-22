import { createServerFn } from "@tanstack/react-start";
import { getCatalog, getStock, getSizeStock } from "../catalog.server";

// Server function so route loaders (which can run on the client) get the catalog
// from the server. Returns the DB catalog when CATALOG_FROM_DB=1, else static.
export const loadCatalog = createServerFn({ method: "GET" }).handler(async () => {
  return await getCatalog();
});

// Shared-inventory availability by slug for out-of-stock gating ({} = no gating).
export const loadStock = createServerFn({ method: "GET" }).handler(async () => {
  return await getStock();
});

// Per-size availability { slug: { "5 mg": 12 } }. Opt-in via SIZE_STOCK=1;
// {} = fall back to product-level stock (exactly today's behavior).
export const loadSizeStock = createServerFn({ method: "GET" }).handler(async () => {
  return await getSizeStock();
});
