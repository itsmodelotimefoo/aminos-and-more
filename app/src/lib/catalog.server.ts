// Headless catalog provider. When CATALOG_FROM_DB=1 (and Supabase is configured)
// the storefront renders the catalog the Ops Hub controls; otherwise — or on ANY
// error — it falls back to the built-in static PRODUCTS, so the store can never
// be taken down by the database. Never throws.
//
// Secrets (server-side only): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or anon),
// and the flag CATALOG_FROM_DB=1 to switch the live store onto the DB catalog.
import { env } from "cloudflare:workers";
import { PRODUCTS, type Product, type ProductKind } from "./products";

function cfg() {
  const e = env as Record<string, string | undefined>;
  if (e.CATALOG_FROM_DB !== "1") return null; // flag off → static catalog
  const url = e.SUPABASE_URL;
  const key = e.SUPABASE_SERVICE_ROLE_KEY || e.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

type Row = {
  slug?: string;
  name?: string;
  cls?: string;
  kind?: string;
  accent?: string;
  img?: string;
  blurb?: string;
  cas?: string;
  formula?: string;
  mw?: string;
  sizes?: [string, number][]; // [label, CENTS]
};

function toProduct(r: Row): Product {
  const kind = (r.kind === "duo" || r.kind === "blend" ? r.kind : "peptide") as ProductKind;
  return {
    slug: r.slug || "",
    name: r.name || r.slug || "",
    cls: r.cls || "",
    kind,
    accent: r.accent || "var(--copper)",
    img: r.img || `/products/${r.slug}.png`,
    tag: kind === "duo" ? "Duo" : kind === "blend" ? "Blend" : undefined,
    blurb: r.blurb || "",
    // DB stores cents; the store's Product uses whole USD.
    sizes: (Array.isArray(r.sizes) ? r.sizes : []).map(
      ([l, c]) => [l, Math.round((c || 0) / 100)] as [string, number],
    ),
    cas: r.cas || "",
    formula: r.formula || "",
    mw: r.mw || "",
  };
}

// Small per-isolate cache so we don't hit Supabase on every page render. Hub
// edits appear within CATALOG_TTL_MS (default 60s). On a fetch error we serve
// the last good catalog rather than snapping back to static (no price flicker).
let _cache: { at: number; data: Product[] } | null = null;

export async function getCatalog(): Promise<Product[]> {
  const c = cfg();
  if (!c) return PRODUCTS; // flag off → static is instant, no cache needed
  const ttl = Number((env as Record<string, string | undefined>).CATALOG_TTL_MS) || 60_000;
  const now = Date.now();
  if (_cache && now - _cache.at < ttl) return _cache.data;
  try {
    const res = await fetch(
      `${c.url}/rest/v1/products?select=*&active=eq.true&order=sort.asc`,
      { headers: { apikey: c.key, Authorization: `Bearer ${c.key}` } },
    );
    if (!res.ok) return _cache?.data ?? PRODUCTS;
    const rows = (await res.json()) as Row[];
    const mapped = Array.isArray(rows)
      ? rows.filter((r) => r.slug && Array.isArray(r.sizes) && r.sizes.length).map(toProduct)
      : [];
    const data = mapped.length ? mapped : PRODUCTS; // empty/garbage → fall back
    _cache = { at: now, data };
    return data;
  } catch {
    return _cache?.data ?? PRODUCTS; // serve stale on transient error
  }
}

export async function getCatalogProduct(slug: string): Promise<Product | undefined> {
  return (await getCatalog()).find((p) => p.slug === slug);
}

// Shared-inventory availability by product slug, for out-of-stock gating.
// Flag off or any error → {} (no gating: the store behaves exactly as before).
type InvEmbed = { slug?: string; inventory?: { on_hand?: number } | { on_hand?: number }[] | null };
let _stock: { at: number; data: Record<string, number> } | null = null;

export async function getStock(): Promise<Record<string, number>> {
  const c = cfg();
  if (!c) return {};
  const ttl = Number((env as Record<string, string | undefined>).CATALOG_TTL_MS) || 60_000;
  const now = Date.now();
  if (_stock && now - _stock.at < ttl) return _stock.data;
  try {
    const res = await fetch(
      `${c.url}/rest/v1/products?select=slug,inventory(on_hand)&active=eq.true`,
      { headers: { apikey: c.key, Authorization: `Bearer ${c.key}` } },
    );
    if (!res.ok) return _stock?.data ?? {};
    const rows = (await res.json()) as InvEmbed[];
    const map: Record<string, number> = {};
    if (Array.isArray(rows)) {
      for (const r of rows) {
        if (!r.slug) continue;
        const inv = Array.isArray(r.inventory) ? r.inventory[0] : r.inventory;
        if (inv && typeof inv.on_hand === "number") map[r.slug] = inv.on_hand;
      }
    }
    _stock = { at: now, data: map };
    return map;
  } catch {
    return _stock?.data ?? {};
  }
}
