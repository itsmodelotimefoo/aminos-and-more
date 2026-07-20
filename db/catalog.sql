-- Real Aminos & More catalog -> Supabase (generated from app/src/lib/products.ts).
-- Idempotent upsert. Prices in CENTS. Run AFTER db/schema.sql.

insert into products (sku, slug, name, cls, kind, accent, img, blurb, cas, formula, mw, sizes, active, sort, peptide) values ('GHKCU', 'ghk-cu', 'GHK-Cu', 'Copper-Binding Tripeptide', 'peptide', 'var(--copper)', '/products/ghk-cu.png', 'The Coppersmith. Copper is the cofactor for lysyl oxidase — the enzyme that cross-links collagen and elastin into matrix.', '89030-95-5', 'C14H22CuN6O4', '401.9 Da', '[["50 mg",3000],["100 mg",4500]]'::jsonb, true, 0, 'GHK-Cu')
on conflict (sku) do update set slug=excluded.slug, name=excluded.name, cls=excluded.cls, kind=excluded.kind, accent=excluded.accent, img=excluded.img, blurb=excluded.blurb, cas=excluded.cas, formula=excluded.formula, mw=excluded.mw, sizes=excluded.sizes, sort=excluded.sort;
insert into inventory (sku, on_hand) values ('GHKCU', 25) on conflict (sku) do nothing;

insert into products (sku, slug, name, cls, kind, accent, img, blurb, cas, formula, mw, sizes, active, sort, peptide) values ('BPC157', 'bpc-157', 'BPC-157', 'Pentadecapeptide', 'peptide', 'var(--crimson)', '/products/bpc-157.png', 'The Roadbuilder. Modulates eNOS / VEGFR2 angiogenesis; its triple-proline core resists proteolysis.', '137525-51-0', 'C62H98N16O22', '1419.56 Da', '[["5 mg",3600],["10 mg",6600]]'::jsonb, true, 1, 'BPC-157')
on conflict (sku) do update set slug=excluded.slug, name=excluded.name, cls=excluded.cls, kind=excluded.kind, accent=excluded.accent, img=excluded.img, blurb=excluded.blurb, cas=excluded.cas, formula=excluded.formula, mw=excluded.mw, sizes=excluded.sizes, sort=excluded.sort;
insert into inventory (sku, on_hand) values ('BPC157', 25) on conflict (sku) do nothing;

insert into products (sku, slug, name, cls, kind, accent, img, blurb, cas, formula, mw, sizes, active, sort, peptide) values ('TB500', 'tb-500', 'TB-500', 'Actin-Binding Peptide', 'peptide', 'var(--cyan)', '/products/tb-500.png', 'The Framer. Sequesters G-actin and releases it to build F-actin filaments at the cell''s leading edge.', '77591-33-4', 'C212H350N56O78S', '4963.51 Da', '[["2 mg",4000],["5 mg",8000],["10 mg",15000]]'::jsonb, true, 2, 'TB-500')
on conflict (sku) do update set slug=excluded.slug, name=excluded.name, cls=excluded.cls, kind=excluded.kind, accent=excluded.accent, img=excluded.img, blurb=excluded.blurb, cas=excluded.cas, formula=excluded.formula, mw=excluded.mw, sizes=excluded.sizes, sort=excluded.sort;
insert into inventory (sku, on_hand) values ('TB500', 25) on conflict (sku) do nothing;

insert into products (sku, slug, name, cls, kind, accent, img, blurb, cas, formula, mw, sizes, active, sort, peptide) values ('MOTSC', 'mots-c', 'MOTS-c', 'Mitochondrial-Derived Peptide', 'peptide', 'var(--eblue)', '/products/mots-c.png', 'The Power Runner. Activates AMPK via the folate–AICAR pathway; studied as an exercise-mimetic.', '1627580-64-6', 'C101H152N28O22S2', '2174.57 Da', '[["10 mg",6500],["20 mg",12500],["40 mg",22000]]'::jsonb, true, 3, 'MOTS-c')
on conflict (sku) do update set slug=excluded.slug, name=excluded.name, cls=excluded.cls, kind=excluded.kind, accent=excluded.accent, img=excluded.img, blurb=excluded.blurb, cas=excluded.cas, formula=excluded.formula, mw=excluded.mw, sizes=excluded.sizes, sort=excluded.sort;
insert into inventory (sku, on_hand) values ('MOTSC', 25) on conflict (sku) do nothing;

insert into products (sku, slug, name, cls, kind, accent, img, blurb, cas, formula, mw, sizes, active, sort, peptide) values ('NADP', 'nad', 'NAD+', 'Coenzyme', 'peptide', 'var(--gold)', '/products/nad.png', 'The energy-currency courier. A redox coenzyme central to cellular electron transfer and metabolism.', '53-84-9', 'C21H27N7O14P2', '663.43 Da', '[["500 mg",5000],["1000 mg",7500]]'::jsonb, true, 4, 'NAD+')
on conflict (sku) do update set slug=excluded.slug, name=excluded.name, cls=excluded.cls, kind=excluded.kind, accent=excluded.accent, img=excluded.img, blurb=excluded.blurb, cas=excluded.cas, formula=excluded.formula, mw=excluded.mw, sizes=excluded.sizes, sort=excluded.sort;
insert into inventory (sku, on_hand) values ('NADP', 25) on conflict (sku) do nothing;

insert into products (sku, slug, name, cls, kind, accent, img, blurb, cas, formula, mw, sizes, active, sort, peptide) values ('SS31', 'ss-31', 'SS-31', 'Mito-Targeted Tetrapeptide', 'peptide', 'var(--magenta)', '/products/ss-31.png', 'The Membrane Guard. Binds cardiolipin on the inner mitochondrial membrane, stabilizing the cristae.', '736992-21-5', 'C32H49N9O5', '639.80 Da', '[["10 mg",10000],["50 mg",31000]]'::jsonb, true, 5, 'SS-31')
on conflict (sku) do update set slug=excluded.slug, name=excluded.name, cls=excluded.cls, kind=excluded.kind, accent=excluded.accent, img=excluded.img, blurb=excluded.blurb, cas=excluded.cas, formula=excluded.formula, mw=excluded.mw, sizes=excluded.sizes, sort=excluded.sort;
insert into inventory (sku, on_hand) values ('SS31', 25) on conflict (sku) do nothing;

insert into products (sku, slug, name, cls, kind, accent, img, blurb, cas, formula, mw, sizes, active, sort, peptide) values ('3A', '3a', '3A', 'Triple Agonist · GIP·GLP-1·GCG', 'peptide', 'var(--amber)', '/products/3a.png', 'One molecule engaging three receptors — GIP, GLP-1 and glucagon. Mechanism nomenclature only.', '2381089-83-2', 'Verify by CoA', 'Verify by CoA', '[["5 mg",7000],["10 mg",10500],["15 mg",13000],["20 mg",15000],["30 mg",19000],["40 mg",21000],["60 mg",34000]]'::jsonb, true, 6, '3A')
on conflict (sku) do update set slug=excluded.slug, name=excluded.name, cls=excluded.cls, kind=excluded.kind, accent=excluded.accent, img=excluded.img, blurb=excluded.blurb, cas=excluded.cas, formula=excluded.formula, mw=excluded.mw, sizes=excluded.sizes, sort=excluded.sort;
insert into inventory (sku, on_hand) values ('3A', 25) on conflict (sku) do nothing;

insert into products (sku, slug, name, cls, kind, accent, img, blurb, cas, formula, mw, sizes, active, sort, peptide) values ('CJCIPA', 'cjc-ipa', 'CJC-1295 + Ipamorelin', 'GHRH · GHS-R Duo', 'duo', 'var(--green)', '/products/cjc-ipa.png', 'The gremlin & the herald. Ipamorelin engages the ghrelin (GHS-R) receptor; CJC-1295 is the GHRH release-signal.', 'Blend', 'Blend', 'Combined', '[["10 mg",10500]]'::jsonb, true, 7, 'CJC-1295 + Ipamorelin')
on conflict (sku) do update set slug=excluded.slug, name=excluded.name, cls=excluded.cls, kind=excluded.kind, accent=excluded.accent, img=excluded.img, blurb=excluded.blurb, cas=excluded.cas, formula=excluded.formula, mw=excluded.mw, sizes=excluded.sizes, sort=excluded.sort;
insert into inventory (sku, on_hand) values ('CJCIPA', 25) on conflict (sku) do nothing;

insert into products (sku, slug, name, cls, kind, accent, img, blurb, cas, formula, mw, sizes, active, sort, peptide) values ('THESTACK', 'the-stack', 'The Stack', 'Dual Peptide · BPC-157 + TB-500', 'duo', 'var(--crimson)', '/products/the-stack.png', 'Two builders, one crew. Vessel-roads meet actin scaffold.', 'Blend', 'Blend', 'Combined', '[["10 mg",10000],["20 mg",20000],["30 mg",27000]]'::jsonb, true, 8, 'The Stack')
on conflict (sku) do update set slug=excluded.slug, name=excluded.name, cls=excluded.cls, kind=excluded.kind, accent=excluded.accent, img=excluded.img, blurb=excluded.blurb, cas=excluded.cas, formula=excluded.formula, mw=excluded.mw, sizes=excluded.sizes, sort=excluded.sort;
insert into inventory (sku, on_hand) values ('THESTACK', 25) on conflict (sku) do nothing;

insert into products (sku, slug, name, cls, kind, accent, img, blurb, cas, formula, mw, sizes, active, sort, peptide) values ('GLOW', 'glow', 'GLOW', 'GHK-Cu · BPC-157 · TB-500', 'blend', 'var(--eblue)', '/products/glow.png', 'The glow blend. Three foundations in one vial.', 'Blend', 'Blend', 'Combined', '[["70 mg",17000]]'::jsonb, true, 9, 'GLOW')
on conflict (sku) do update set slug=excluded.slug, name=excluded.name, cls=excluded.cls, kind=excluded.kind, accent=excluded.accent, img=excluded.img, blurb=excluded.blurb, cas=excluded.cas, formula=excluded.formula, mw=excluded.mw, sizes=excluded.sizes, sort=excluded.sort;
insert into inventory (sku, on_hand) values ('GLOW', 25) on conflict (sku) do nothing;

insert into products (sku, slug, name, cls, kind, accent, img, blurb, cas, formula, mw, sizes, active, sort, peptide) values ('KLOW', 'klow', 'KLOW', 'KPV · GHK-Cu · BPC-157 · TB-500', 'blend', 'var(--purple)', '/products/klow.png', 'The king. GLOW with KPV added — the crowned four-compound blend.', 'Blend', 'Blend', 'Combined', '[["80 mg",18000]]'::jsonb, true, 10, 'KLOW')
on conflict (sku) do update set slug=excluded.slug, name=excluded.name, cls=excluded.cls, kind=excluded.kind, accent=excluded.accent, img=excluded.img, blurb=excluded.blurb, cas=excluded.cas, formula=excluded.formula, mw=excluded.mw, sizes=excluded.sizes, sort=excluded.sort;
insert into inventory (sku, on_hand) values ('KLOW', 25) on conflict (sku) do nothing;

