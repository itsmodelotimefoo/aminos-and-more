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
insert into size_stock (slug, size, on_hand)
select p.slug,
       (elem->>0) as size,
       25         as on_hand
from products p,
     lateral jsonb_array_elements(p.sizes) elem
where p.slug is not null
  and p.active is not false
  and coalesce(elem->>0, '') <> ''
on conflict (slug, size) do nothing;

-- Verify what landed:
--   select slug, size, on_hand from size_stock order by slug, size;
