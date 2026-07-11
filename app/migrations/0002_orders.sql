-- Orders for the crypto (NOWPayments) + Shippo checkout flow.
-- Additive only (see 0001_init.sql). Bound as env.DB.

CREATE TABLE IF NOT EXISTS orders (
  id                    TEXT PRIMARY KEY,           -- our order id (also NOWPayments order_id)
  created_at            INTEGER NOT NULL,           -- epoch ms
  updated_at            INTEGER NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending', -- pending | paid | fulfilled | failed | expired

  email                 TEXT NOT NULL,
  items_json            TEXT NOT NULL,              -- JSON array of {slug,name,size,unit_cents,qty}
  subtotal_cents        INTEGER NOT NULL,
  shipping_cents        INTEGER NOT NULL DEFAULT 0,
  total_cents           INTEGER NOT NULL,

  certified_21          INTEGER NOT NULL DEFAULT 0,
  certified_researcher  INTEGER NOT NULL DEFAULT 0,

  ship_name             TEXT,
  ship_street1          TEXT,
  ship_street2          TEXT,
  ship_city             TEXT,
  ship_state            TEXT,
  ship_zip              TEXT,
  ship_country          TEXT,
  ship_phone            TEXT,

  shippo_rate_id        TEXT,
  ship_carrier          TEXT,
  ship_service          TEXT,

  np_invoice_id         TEXT,
  np_payment_id         TEXT,
  np_payment_status     TEXT,
  pay_currency          TEXT,

  tracking_number       TEXT,
  tracking_carrier      TEXT,
  label_url             TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_np_invoice ON orders(np_invoice_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
