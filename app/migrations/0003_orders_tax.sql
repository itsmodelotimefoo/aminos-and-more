-- Add estimated sales tax to orders. Additive (see 0001_init.sql).
ALTER TABLE orders ADD COLUMN tax_cents INTEGER NOT NULL DEFAULT 0;
