-- ============================================================================
-- Operations Hub — shared multi-brand commerce schema (Supabase / Postgres)
--
-- One source of truth across every storefront brand (aminosandmore.com,
-- getwll.com, and any future re-skin). Every order is stamped with `store_slug`
-- so fulfillment knows which labels/packaging to use, and so payments,
-- inventory, Shippo and NOWPayments can be shared while staying attributable.
--
-- Apply via Supabase SQL editor, `supabase db push`, or the apply_migration MCP.
-- Idempotent-ish: uses IF NOT EXISTS where possible. Review before running.
-- ============================================================================

-- ---------- brands / stores -------------------------------------------------
create table if not exists stores (
  slug          text primary key,                 -- 'aminos', 'getwll'
  name          text not null,                    -- 'Aminos & More'
  domain        text,                             -- 'aminosandmore.com'
  order_prefix  text not null,                    -- 'AM', 'WL' (matches order id)
  -- packaging/label instructions shown to whoever fulfills the order, plus the
  -- ship-from address used for this brand's Shippo labels.
  label_profile jsonb not null default '{}'::jsonb,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------- shared peptide catalog -----------------------------------------
create table if not exists products (
  sku        text primary key,                    -- shared SKU across brands
  peptide    text not null,                       -- 'BPC-157'
  name       text not null,
  created_at timestamptz not null default now()
);

-- per-brand "skin" of a shared product (name/price/packaging differ per brand)
create table if not exists store_products (
  store_slug   text not null references stores(slug) on delete cascade,
  sku          text not null references products(sku) on delete cascade,
  display_name text,
  price_cents  integer,
  packaging    text,                              -- brand-specific packaging note
  primary key (store_slug, sku)
);

-- ---------- shared inventory (one stock pool across brands) ------------------
create table if not exists inventory (
  sku        text primary key references products(sku) on delete cascade,
  on_hand    integer not null default 0,
  reserved   integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------- orders (mirrors the storefront order + brand attribution) --------
create table if not exists orders (
  id                 text primary key,            -- 'AM-1A2B3C4D' / 'WL-...'
  store_slug         text not null references stores(slug),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  status             text not null default 'pending',  -- pending|paid|fulfilled|failed|expired
  email              text,
  items              jsonb not null default '[]'::jsonb,
  subtotal_cents     integer,
  shipping_cents     integer,
  tax_cents          integer,
  total_cents        integer,
  certified_21       boolean,
  certified_researcher boolean,
  -- shipping address
  ship_name    text, ship_street1 text, ship_street2 text, ship_city text,
  ship_state   text, ship_zip text, ship_country text, ship_phone text,
  -- shipping / Shippo
  shippo_rate_id text, ship_carrier text, ship_service text,
  tracking_number text, tracking_carrier text, label_url text,
  -- payment / NOWPayments
  np_invoice_id text, np_payment_id text, np_payment_status text, pay_currency text,
  -- future ad-campaign attribution (utm_source/medium/campaign per brand)
  utm jsonb not null default '{}'::jsonb
);
create index if not exists orders_store_created_idx on orders (store_slug, created_at desc);
create index if not exists orders_status_idx on orders (status);

-- normalized line items (items jsonb above is kept for convenience/audit)
create table if not exists order_items (
  id         bigint generated always as identity primary key,
  order_id   text not null references orders(id) on delete cascade,
  sku        text,
  name       text,
  size       text,
  unit_cents integer,
  qty        integer not null default 1
);
create index if not exists order_items_order_idx on order_items (order_id);

-- keep updated_at fresh on orders
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
drop trigger if exists orders_touch on orders;
create trigger orders_touch before update on orders
  for each row execute function touch_updated_at();

-- ---------- lab results / COAs by lot ---------------------------------------
-- "Tested by lot" — each production lot's certificate of analysis. Surfaced at
-- fulfillment so the right COA ships with the right lot.
create table if not exists lots (
  id         bigint generated always as identity primary key,
  lot_code   text not null,
  sku        text references products(sku) on delete set null,
  purity     numeric,                          -- e.g. 99.2 (percent)
  tested_on  date,
  result     text not null default 'pass',     -- pass | fail | pending
  coa_url    text,                             -- link to the COA PDF/image
  qty        integer,
  notes      text,
  created_at timestamptz not null default now()
);
create index if not exists lots_sku_idx on lots (sku, tested_on desc);

-- ---------- staff allowlist (drives RLS) ------------------------------------
create table if not exists staff (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       text not null default 'admin',
  created_at timestamptz not null default now()
);

create or replace function is_staff() returns boolean as $$
  select exists (select 1 from staff s where s.user_id = auth.uid());
$$ language sql stable security definer;

-- ---------- Row Level Security ----------------------------------------------
-- The Hub ships the public anon key in the browser; RLS is what keeps order
-- data private. Only authenticated users listed in `staff` can read/write.
-- Storefronts write orders with the SERVICE ROLE key, which bypasses RLS.
alter table orders         enable row level security;
alter table order_items    enable row level security;
alter table inventory      enable row level security;
alter table stores         enable row level security;
alter table products       enable row level security;
alter table store_products enable row level security;
alter table lots           enable row level security;
alter table staff          enable row level security;

do $$
declare t text;
begin
  foreach t in array array['orders','order_items','inventory','stores','products','store_products','lots'] loop
    execute format('drop policy if exists staff_all on %I;', t);
    execute format(
      'create policy staff_all on %I for all to authenticated using (is_staff()) with check (is_staff());', t);
  end loop;
end $$;

-- staff can see the staff table (to render "who has access"); no self-insert.
drop policy if exists staff_read on staff;
create policy staff_read on staff for select to authenticated using (is_staff());
