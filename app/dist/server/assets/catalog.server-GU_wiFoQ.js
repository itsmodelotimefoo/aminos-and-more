import { env } from "cloudflare:workers";
const PRODUCTS = [
  {
    slug: "ghk-cu",
    name: "GHK-Cu",
    cls: "Copper-Binding Tripeptide",
    kind: "peptide",
    accent: "var(--copper)",
    img: "/products/ghk-cu.png",
    blurb: "The Coppersmith. Copper is the cofactor for lysyl oxidase — the enzyme that cross-links collagen and elastin into matrix.",
    sizes: [["50 mg", 30], ["100 mg", 45]],
    cas: "89030-95-5",
    formula: "C14H22CuN6O4",
    mw: "401.9 Da"
  },
  {
    slug: "bpc-157",
    name: "BPC-157",
    cls: "Pentadecapeptide",
    kind: "peptide",
    accent: "var(--crimson)",
    img: "/products/bpc-157.png",
    blurb: "The Roadbuilder. Modulates eNOS / VEGFR2 angiogenesis; its triple-proline core resists proteolysis.",
    sizes: [["5 mg", 36], ["10 mg", 66]],
    cas: "137525-51-0",
    formula: "C62H98N16O22",
    mw: "1419.56 Da"
  },
  {
    slug: "tb-500",
    name: "TB-500",
    cls: "Actin-Binding Peptide",
    kind: "peptide",
    accent: "var(--cyan)",
    img: "/products/tb-500.png",
    blurb: "The Framer. Sequesters G-actin and releases it to build F-actin filaments at the cell's leading edge.",
    sizes: [["2 mg", 40], ["5 mg", 80], ["10 mg", 150]],
    cas: "77591-33-4",
    formula: "C212H350N56O78S",
    mw: "4963.51 Da"
  },
  {
    slug: "mots-c",
    name: "MOTS-c",
    cls: "Mitochondrial-Derived Peptide",
    kind: "peptide",
    accent: "var(--eblue)",
    img: "/products/mots-c.png",
    blurb: "The Power Runner. Activates AMPK via the folate–AICAR pathway; studied as an exercise-mimetic.",
    sizes: [["10 mg", 65], ["20 mg", 125], ["40 mg", 220]],
    cas: "1627580-64-6",
    formula: "C101H152N28O22S2",
    mw: "2174.57 Da"
  },
  {
    slug: "nad",
    name: "NAD+",
    cls: "Coenzyme",
    kind: "peptide",
    accent: "var(--gold)",
    img: "/products/nad.png",
    blurb: "The energy-currency courier. A redox coenzyme central to cellular electron transfer and metabolism.",
    sizes: [["500 mg", 50], ["1000 mg", 75]],
    cas: "53-84-9",
    formula: "C21H27N7O14P2",
    mw: "663.43 Da"
  },
  {
    slug: "ss-31",
    name: "SS-31",
    cls: "Mito-Targeted Tetrapeptide",
    kind: "peptide",
    accent: "var(--magenta)",
    img: "/products/ss-31.png",
    blurb: "The Membrane Guard. Binds cardiolipin on the inner mitochondrial membrane, stabilizing the cristae.",
    sizes: [["10 mg", 100], ["50 mg", 310]],
    cas: "736992-21-5",
    formula: "C32H49N9O5",
    mw: "639.80 Da"
  },
  {
    slug: "3a",
    name: "3A",
    cls: "Triple Agonist · GIP·GLP-1·GCG",
    kind: "peptide",
    accent: "var(--amber)",
    img: "/products/3a.png",
    blurb: "One molecule engaging three receptors — GIP, GLP-1 and glucagon. Mechanism nomenclature only.",
    sizes: [
      ["5 mg", 70],
      ["10 mg", 105],
      ["15 mg", 130],
      ["20 mg", 150],
      ["30 mg", 190],
      ["40 mg", 210],
      ["60 mg", 340]
    ],
    cas: "2381089-83-2",
    formula: "Verify by CoA",
    mw: "Verify by CoA"
  },
  {
    slug: "cjc-ipa",
    name: "CJC-1295 + Ipamorelin",
    cls: "GHRH · GHS-R Duo",
    kind: "duo",
    accent: "var(--green)",
    tag: "Duo",
    img: "/products/cjc-ipa.png",
    blurb: "The gremlin & the herald. Ipamorelin engages the ghrelin (GHS-R) receptor; CJC-1295 is the GHRH release-signal.",
    sizes: [["10 mg", 105]],
    cas: "Blend",
    formula: "Blend",
    mw: "Combined"
  },
  {
    slug: "the-stack",
    name: "The Stack",
    cls: "Dual Peptide · BPC-157 + TB-500",
    kind: "duo",
    accent: "var(--crimson)",
    tag: "Duo",
    img: "/products/the-stack.png",
    blurb: "Two builders, one crew. Vessel-roads meet actin scaffold.",
    sizes: [["10 mg", 100], ["20 mg", 200], ["30 mg", 270]],
    cas: "Blend",
    formula: "Blend",
    mw: "Combined"
  },
  {
    slug: "glow",
    name: "GLOW",
    cls: "GHK-Cu · BPC-157 · TB-500",
    kind: "blend",
    accent: "var(--eblue)",
    tag: "Blend",
    img: "/products/glow.png",
    blurb: "The glow blend. Three foundations in one vial.",
    sizes: [["70 mg", 170]],
    cas: "Blend",
    formula: "Blend",
    mw: "Combined"
  },
  {
    slug: "klow",
    name: "KLOW",
    cls: "KPV · GHK-Cu · BPC-157 · TB-500",
    kind: "blend",
    accent: "var(--purple)",
    tag: "Blend",
    img: "/products/klow.png",
    blurb: "The king. GLOW with KPV added — the crowned four-compound blend.",
    sizes: [["80 mg", 180]],
    cas: "Blend",
    formula: "Blend",
    mw: "Combined"
  }
];
function getProduct(slug) {
  return PRODUCTS.find((p) => p.slug === slug);
}
function fromPrice(p) {
  return "from $" + Math.min(...p.sizes.map((s) => s[1]));
}
function cfg() {
  const e = env;
  if (e.CATALOG_FROM_DB !== "1") return null;
  const url = e.SUPABASE_URL;
  const key = e.SUPABASE_SERVICE_ROLE_KEY || e.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}
function toProduct(r) {
  const kind = r.kind === "duo" || r.kind === "blend" ? r.kind : "peptide";
  return {
    slug: r.slug || "",
    name: r.name || r.slug || "",
    cls: r.cls || "",
    kind,
    accent: r.accent || "var(--copper)",
    img: r.img || `/products/${r.slug}.png`,
    tag: kind === "duo" ? "Duo" : kind === "blend" ? "Blend" : void 0,
    blurb: r.blurb || "",
    // DB stores cents; the store's Product uses whole USD.
    sizes: (Array.isArray(r.sizes) ? r.sizes : []).map(
      ([l, c]) => [l, Math.round((c || 0) / 100)]
    ),
    cas: r.cas || "",
    formula: r.formula || "",
    mw: r.mw || ""
  };
}
let _cache = null;
async function getCatalog() {
  const c = cfg();
  if (!c) return PRODUCTS;
  const ttl = Number(env.CATALOG_TTL_MS) || 6e4;
  const now = Date.now();
  if (_cache && now - _cache.at < ttl) return _cache.data;
  try {
    const res = await fetch(
      `${c.url}/rest/v1/products?select=*&active=eq.true&order=sort.asc`,
      { headers: { apikey: c.key, Authorization: `Bearer ${c.key}` } }
    );
    if (!res.ok) return _cache?.data ?? PRODUCTS;
    const rows = await res.json();
    const mapped = Array.isArray(rows) ? rows.filter((r) => r.slug && Array.isArray(r.sizes) && r.sizes.length).map(toProduct) : [];
    const data = mapped.length ? mapped : PRODUCTS;
    _cache = { at: now, data };
    return data;
  } catch {
    return _cache?.data ?? PRODUCTS;
  }
}
export {
  getProduct as a,
  fromPrice as f,
  getCatalog as g
};
