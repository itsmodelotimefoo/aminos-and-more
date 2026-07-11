// Server-only order persistence in D1 (env.DB). Guard: DB is present only when
// app.manifest.json sets "db": true.
import { bindings } from "./bindings.server";
import type { CartLine } from "./checkout";

export type OrderStatus = "pending" | "paid" | "fulfilled" | "failed" | "expired";

export type OrderRow = {
  id: string;
  created_at: number;
  updated_at: number;
  status: OrderStatus;
  email: string;
  items_json: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  certified_21: number;
  certified_researcher: number;
  ship_name: string | null;
  ship_street1: string | null;
  ship_street2: string | null;
  ship_city: string | null;
  ship_state: string | null;
  ship_zip: string | null;
  ship_country: string | null;
  ship_phone: string | null;
  shippo_rate_id: string | null;
  ship_carrier: string | null;
  ship_service: string | null;
  np_invoice_id: string | null;
  np_payment_id: string | null;
  np_payment_status: string | null;
  pay_currency: string | null;
  tracking_number: string | null;
  tracking_carrier: string | null;
  label_url: string | null;
};

function db() {
  const { DB } = bindings();
  if (!DB) throw new Error("Database not configured (D1 binding missing).");
  return DB;
}

export type NewOrder = {
  id: string;
  email: string;
  items: CartLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  certified21: boolean;
  certifiedResearcher: boolean;
  ship: {
    name: string; street1: string; street2: string; city: string;
    state: string; zip: string; country: string; phone: string;
  };
  shippoRateId: string;
  carrier: string;
  service: string;
};

export async function insertOrder(o: NewOrder): Promise<void> {
  const now = Date.now();
  await db()
    .prepare(
      `INSERT INTO orders (
        id, created_at, updated_at, status, email, items_json,
        subtotal_cents, shipping_cents, total_cents,
        certified_21, certified_researcher,
        ship_name, ship_street1, ship_street2, ship_city, ship_state, ship_zip, ship_country, ship_phone,
        shippo_rate_id, ship_carrier, ship_service
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .bind(
      o.id, now, now, "pending", o.email, JSON.stringify(o.items),
      o.subtotalCents, o.shippingCents, o.totalCents,
      o.certified21 ? 1 : 0, o.certifiedResearcher ? 1 : 0,
      o.ship.name, o.ship.street1, o.ship.street2, o.ship.city, o.ship.state, o.ship.zip, o.ship.country, o.ship.phone,
      o.shippoRateId, o.carrier, o.service,
    )
    .run();
}

export async function getOrder(id: string): Promise<OrderRow | null> {
  return await db().prepare("SELECT * FROM orders WHERE id = ?").bind(id).first<OrderRow>();
}

export async function getOrderByInvoice(invoiceId: string): Promise<OrderRow | null> {
  return await db()
    .prepare("SELECT * FROM orders WHERE np_invoice_id = ?")
    .bind(invoiceId)
    .first<OrderRow>();
}

export async function setInvoiceId(orderId: string, invoiceId: string): Promise<void> {
  await db()
    .prepare("UPDATE orders SET np_invoice_id = ?, updated_at = ? WHERE id = ?")
    .bind(invoiceId, Date.now(), orderId)
    .run();
}

export async function updatePayment(
  orderId: string,
  fields: {
    status: OrderStatus;
    npPaymentId?: string | null;
    npPaymentStatus?: string | null;
    payCurrency?: string | null;
  },
): Promise<void> {
  await db()
    .prepare(
      `UPDATE orders SET status = ?, np_payment_id = COALESCE(?, np_payment_id),
         np_payment_status = COALESCE(?, np_payment_status),
         pay_currency = COALESCE(?, pay_currency), updated_at = ? WHERE id = ?`,
    )
    .bind(
      fields.status,
      fields.npPaymentId ?? null,
      fields.npPaymentStatus ?? null,
      fields.payCurrency ?? null,
      Date.now(),
      orderId,
    )
    .run();
}

export async function setFulfillment(
  orderId: string,
  f: { carrier: string; tracking: string; labelUrl: string },
): Promise<void> {
  await db()
    .prepare(
      `UPDATE orders SET status = 'fulfilled',
         tracking_number = ?, tracking_carrier = ?, label_url = ?, updated_at = ? WHERE id = ?`,
    )
    .bind(f.tracking, f.carrier, f.labelUrl, Date.now(), orderId)
    .run();
}
