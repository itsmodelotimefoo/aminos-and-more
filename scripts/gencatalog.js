const fs = require('fs');
const src = fs.readFileSync('app/src/lib/products.ts', 'utf8');
const eq = src.indexOf('PRODUCTS: Product[] =');
const arrStart = src.indexOf('[', eq + 'PRODUCTS: Product[] ='.length);
let depth = 0, end = -1;
for (let i = arrStart; i < src.length; i++) {
  const ch = src[i];
  if (ch === '[') depth++;
  else if (ch === ']') { depth--; if (depth === 0) { end = i; break; } }
}
const lit = src.slice(arrStart, end + 1);
const PRODUCTS = eval(lit);
const SKU = { 'ghk-cu': 'GHKCU', 'bpc-157': 'BPC157', 'tb-500': 'TB500', 'mots-c': 'MOTSC', 'nad': 'NADP', 'ss-31': 'SS31', '3a': '3A', 'cjc-ipa': 'CJCIPA', 'the-stack': 'THESTACK', 'glow': 'GLOW', 'klow': 'KLOW' };
const q = (s) => "'" + String(s == null ? '' : s).replace(/'/g, "''") + "'";
let out = '-- Real Aminos & More catalog -> Supabase (generated from app/src/lib/products.ts).\n';
out += '-- Idempotent upsert. Prices in CENTS. Run AFTER db/schema.sql.\n\n';
PRODUCTS.forEach((p, idx) => {
  const sku = SKU[p.slug] || p.slug.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const sizes = JSON.stringify((p.sizes || []).map(([l, d]) => [l, Math.round(d * 100)]));
  out += `insert into products (sku, slug, name, cls, kind, accent, img, blurb, cas, formula, mw, sizes, active, sort, peptide) values (`
    + `${q(sku)}, ${q(p.slug)}, ${q(p.name)}, ${q(p.cls)}, ${q(p.kind)}, ${q(p.accent)}, ${q(p.img)}, ${q(p.blurb)}, ${q(p.cas)}, ${q(p.formula)}, ${q(p.mw)}, ${q(sizes)}::jsonb, true, ${idx}, ${q(p.name)})\n`
    + `on conflict (sku) do update set slug=excluded.slug, name=excluded.name, cls=excluded.cls, kind=excluded.kind, accent=excluded.accent, img=excluded.img, blurb=excluded.blurb, cas=excluded.cas, formula=excluded.formula, mw=excluded.mw, sizes=excluded.sizes, sort=excluded.sort;\n`;
  out += `insert into inventory (sku, on_hand) values (${q(sku)}, 25) on conflict (sku) do nothing;\n\n`;
});
fs.writeFileSync('db/catalog.sql', out);
console.log('wrote db/catalog.sql with ' + PRODUCTS.length + ' products');
