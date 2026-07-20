import { createServerFn } from "@tanstack/react-start";
import { getCatalog } from "../catalog.server";

// Server function so route loaders (which can run on the client) get the catalog
// from the server. Returns the DB catalog when CATALOG_FROM_DB=1, else static.
export const loadCatalog = createServerFn({ method: "GET" }).handler(async () => {
  return await getCatalog();
});
