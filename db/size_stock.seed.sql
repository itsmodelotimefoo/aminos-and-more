-- ============================================================================
-- Seed size_stock from the live catalog.
--
-- Expands every active product's `sizes` array into one size_stock row, so you
-- start with every size tracked at a sensible default instead of hand-entering
-- them. Run AFTER the size_stock table exists (db/schema.sql).
--
-- Idempotent: `on conflict do nothing` means re-running never clobbers levels
-- you've already set in the Hub — it only fills in sizes that have no row yet.
--
-- Default level is 25 (comfortably above the low-stock line of 10). Change the
-- `25` below if you want a different starting count, then adjust per size in the
-- Hub → Stock by size. Remember: a size with no row here sells freely, so this
-- makes EVERY size gated — set the ones that are actually out to 0 afterwards.
-- ============================================================================
-- ---------------------------------------------------------------------------
-- OPTION A (default) — seed EVERY size at a flat level (25). Makes all sizes
-- gated. Uncomment to use.
-- ---------------------------------------------------------------------------
-- insert into size_stock (slug, size, on_hand)
-- select p.slug, (elem->>0) as size, 25 as on_hand
-- from products p, lateral jsonb_array_elements(p.sizes) elem
-- where p.slug is not null and p.active is not false and coalesce(elem->>0,'') <> ''
-- on conflict (slug, size) do nothing;

-- ---------------------------------------------------------------------------
-- OPTION B (recommended) — seed ONLY the sizes of products that are low or out
-- at the SKU level, using that SKU's on-hand. Everything healthy stays
-- UNTRACKED and keeps selling freely, so only the sizes that need gating get a
-- row: out (0) → Sold out, low (≤10) → low nudge. Fine-tune per size afterward
-- in the Hub → Stock by size. Note: this copies the SKU's total on-hand onto
-- each of that product's sizes (a starting point, not a per-size split).
-- ---------------------------------------------------------------------------
insert into size_stock (slug, size, on_hand)
select p.slug,
       (elem->>0)  as size,
       i.on_hand   as on_hand
from products p
join inventory i on i.sku = p.sku,
     lateral jsonb_array_elements(p.sizes) elem
where p.slug is not null
  and p.active is not false
  and i.on_hand <= 10                    -- low or out at the SKU level
  and coalesce(elem->>0, '') <> ''
on conflict (slug, size) do nothing;

-- Verify what landed:
--   select slug, size, on_hand from size_stock order by slug, size;
