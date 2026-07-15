// Shared checkout types + helpers (client + server safe — no browser/server
// globals here). Money is integer USD cents everywhere.
import { z } from "zod";

export type CartLine = {
  slug: string;
  name: string;
  size: string; // e.g. "10 mg"
  unitCents: number; // price per unit in cents
  qty: number;
};

export function lineTotalCents(l: CartLine): number {
  return l.unitCents * l.qty;
}

export function subtotalCents(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + lineTotalCents(l), 0);
}

export function formatUsd(cents: number): string {
  return "$" + (cents / 100).toFixed(2);
}

// ---- Validation schemas (used by the checkout API routes) ----

export const cartLineSchema = z.object({
  slug: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  size: z.string().min(1).max(40),
  unitCents: z.number().int().nonnegative().max(10_000_00),
  qty: z.number().int().min(1).max(99),
});

export const addressSchema = z.object({
  name: z.string().min(1).max(120),
  street1: z.string().min(1).max(160),
  street2: z.string().max(160).optional().default(""),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(80),
  zip: z.string().min(1).max(20),
  country: z.string().min(2).max(2), // ISO-2, e.g. "US"
  phone: z.string().max(40).optional().default(""),
});

export type Address = z.infer<typeof addressSchema>;

export const ratesRequestSchema = z.object({
  address: addressSchema,
  items: z.array(cartLineSchema).min(1),
});

export const createOrderSchema = z.object({
  email: z.string().email().max(160),
  address: addressSchema,
  items: z.array(cartLineSchema).min(1),
  shippoRateId: z.string().min(1).max(120),
  shippingCents: z.number().int().nonnegative().max(1_000_00),
  carrier: z.string().min(1).max(80),
  service: z.string().min(1).max(120),
  certified21: z.literal(true),
  certifiedResearcher: z.literal(true),
});

export type RateOption = {
  rateId: string;
  carrier: string;
  service: string;
  amountCents: number;
  estDays: number | null;
};
