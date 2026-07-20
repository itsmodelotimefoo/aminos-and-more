-- ============================================================================
-- Seed: the two brands + shared catalog/inventory. Safe to re-run (upserts).
-- Adjust names/prices/packaging to match reality before going live.
-- ============================================================================

insert into stores (slug, name, domain, order_prefix, label_profile) values
  ('aminos', 'Aminos & More', 'aminosandmore.com', 'AM',
   jsonb_build_object(
     'packaging', 'Aminos & More white-label vials + AM insert card',
     'ship_from', jsonb_build_object('name','Aminos & More','city','','state','','zip',''),
     'accent', '#4f46e5')),
  ('getwll', 'getWLL', 'getwll.com', 'WL',
   jsonb_build_object(
     'packaging', 'WLL branded box + WLL compliance insert',
     'ship_from', jsonb_build_object('name','getWLL','city','','state','','zip',''),
     'accent', '#0ea5a4'))
on conflict (slug) do update
  set name = excluded.name, domain = excluded.domain,
      order_prefix = excluded.order_prefix, label_profile = excluded.label_profile;

-- Shared peptide catalog (SKUs shared across brands).
insert into products (sku, peptide, name) values
  ('BPC157', 'BPC-157', 'BPC-157'),
  ('TB500',  'TB-500',  'TB-500'),
  ('GHKCU',  'GHK-Cu',  'GHK-Cu'),
  ('MOTSC',  'MOTS-c',  'MOTS-c'),
  ('NADP',   'NAD+',    'NAD+'),
  ('SS31',   'SS-31',   'SS-31'),
  ('CJCIPA', 'CJC/IPA', 'CJC-1295 / Ipamorelin'),
  ('GLOW',   'GLOW',    'GLOW Blend')
on conflict (sku) do update set peptide = excluded.peptide, name = excluded.name;

-- Shared inventory pool (one stock count regardless of brand).
insert into inventory (sku, on_hand) values
  ('BPC157', 120), ('TB500', 85), ('GHKCU', 60), ('MOTSC', 40),
  ('NADP', 30), ('SS31', 25), ('CJCIPA', 70), ('GLOW', 50)
on conflict (sku) do update set on_hand = excluded.on_hand, updated_at = now();

-- Per-brand skins (example pricing/packaging — edit to taste).
insert into store_products (store_slug, sku, display_name, price_cents, packaging) values
  ('aminos','BPC157','BPC-157 (5mg)', 6500, 'AM vial + insert'),
  ('getwll','BPC157','WLL BPC-157 5mg', 6900, 'WLL box + insert'),
  ('aminos','TB500','TB-500 (5mg)', 7500, 'AM vial + insert'),
  ('getwll','TB500','WLL TB-500 5mg', 7900, 'WLL box + insert')
on conflict (store_slug, sku) do update
  set display_name = excluded.display_name, price_cents = excluded.price_cents,
      packaging = excluded.packaging;

-- To grant a teammate Hub access after they sign in once:
--   insert into staff (user_id, email) values ('<auth-user-uuid>', 'you@co.com');
