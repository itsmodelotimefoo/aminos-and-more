// getWLL headless catalog. Because getWLL prices/packaging differ from aminos,
// this reads the shared `products` PLUS getWLL's per-brand overrides in
// `store_products` (its own sizes/prices/availability). Flag off or ANY error →
// the built-in static PRODUCTS, so the store can never be taken down by the DB.
//
// Netlify runtime → process.env.
//
// ⚠️  Per-brand prices must exist in store_products (store_slug='getwll') before
//     you set CATALOG_FROM_DB=1 here — otherwise getWLL would render the base
//     (aminos) prices. See APPLY.md "Phase 2".
import { PRODUCTS, type Product, type ProductKind } from "./products";

const STORE = process.env.STORE_SLUG || "getwll";
function cfg() {
  const e = process.env;
  if (e.CATALOG_FROM_DB !== "1") return null;
  const url = e.SUPABASE_URL;
  const key = e.SUPABASE_SERVICE_ROLE_KEY || e.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}
const headers = (key: string) => ({ apikey: key, Authorization: `Bearer ${key}` });

type Row = {
  sku?: string; slug?: string; name?: string; cls?: string; kind?: string; accent?: string;
  img?: string; blurb?: string; cas?: string; formula?: string; mw?: string; sizes?: [string, number][];
};
type Override = { sku?: string; display_name?: string; sizes?: [string, number][]; active?: boolean };

function toProduct(r: Row, ov: Override): Product {
  const kind = (r.kind === "duo" || r.kind === "blend" ? r.kind : "peptide") as ProductKind;
  // per-brand sizes override the base when present & non-empty
  const centsSizes = ov.sizes && ov.sizes.length ? ov.sizes : r.sizes || [];
  return {
    slug: r.slug || "",
    name: ov.display_name || r.name || r.slug || "",
    cls: r.cls || "",
    kind,
    accent: r.accent || "var(--copper)",
    img: r.img || `/products/${r.slug}.png`,
    tag: kind === "duo" ? "Duo" : kind === "blend" ? "Blend" : undefined,
    blurb: r.blurb || "",
    sizes: centsSizes.map(([l, c]) => [l, Math.round((c || 0) / 100)] as [string, number]),
    cas: r.cas || "",
    formula: r.formula || "",
    mw: r.mw || "",
  };
}

export async function getCatalog(): Promise<Product[]> {
  const c = cfg();
  if (!c) return PRODUCTS;
  try {
    const [pRes, oRes] = await Promise.all([
      fetch(`${c.url}/rest/v1/products?select=*&active=eq.true&order=sort.asc`, { headers: headers(c.key) }),
      fetch(`${c.url}/rest/v1/store_products?select=sku,display_name,sizes,active&store_slug=eq.${STORE}`, { headers: headers(c.key) }),
    ]);
    if (!pRes.ok) return PRODUCTS;
    const products = (await pRes.json()) as Row[];
    const overrides = (oRes.ok ? await oRes.json() : []) as Override[];
    const bySku: Record<string, Override> = {};
    overrides.forEach((o) => { if (o.sku) bySku[o.sku] = o; });
    const mapped = (Array.isArray(products) ? products : [])
      .filter((r) => r.slug && (bySku[r.sku || ""]?.active ?? true))            // per-brand hide
      .map((r) => toProduct(r, bySku[r.sku || ""] || {}))
      .filter((p) => p.sizes.length);
    return mapped.length ? mapped : PRODUCTS;
  } catch {
    return PRODUCTS;
  }
}

export async function getCatalogProduct(slug: string): Promise<Product | undefined> {
  return (await getCatalog()).find((p) => p.slug === slug);
}
