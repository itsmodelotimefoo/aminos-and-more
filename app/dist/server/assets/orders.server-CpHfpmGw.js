import { env } from "cloudflare:workers";
function bindings() {
  return env;
}
function db() {
  const { DB } = bindings();
  if (!DB) throw new Error("Database not configured (D1 binding missing).");
  return DB;
}
async function insertOrder(o) {
  const now = Date.now();
  await db().prepare(
    `INSERT INTO orders (
        id, created_at, updated_at, status, email, items_json,
        subtotal_cents, shipping_cents, tax_cents, total_cents,
        certified_21, certified_researcher,
        ship_name, ship_street1, ship_street2, ship_city, ship_state, ship_zip, ship_country, ship_phone,
        shippo_rate_id, ship_carrier, ship_service
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    o.id,
    now,
    now,
    "pending",
    o.email,
    JSON.stringify(o.items),
    o.subtotalCents,
    o.shippingCents,
    o.taxCents,
    o.totalCents,
    o.certified21 ? 1 : 0,
    o.certifiedResearcher ? 1 : 0,
    o.ship.name,
    o.ship.street1,
    o.ship.street2,
    o.ship.city,
    o.ship.state,
    o.ship.zip,
    o.ship.country,
    o.ship.phone,
    o.shippoRateId,
    o.carrier,
    o.service
  ).run();
}
async function getOrder(id) {
  return await db().prepare("SELECT * FROM orders WHERE id = ?").bind(id).first();
}
async function setInvoiceId(orderId, invoiceId) {
  await db().prepare("UPDATE orders SET np_invoice_id = ?, updated_at = ? WHERE id = ?").bind(invoiceId, Date.now(), orderId).run();
}
async function updatePayment(orderId, fields) {
  await db().prepare(
    `UPDATE orders SET status = ?, np_payment_id = COALESCE(?, np_payment_id),
         np_payment_status = COALESCE(?, np_payment_status),
         pay_currency = COALESCE(?, pay_currency), updated_at = ? WHERE id = ?`
  ).bind(
    fields.status,
    fields.npPaymentId ?? null,
    fields.npPaymentStatus ?? null,
    fields.payCurrency ?? null,
    Date.now(),
    orderId
  ).run();
}
async function setFulfillment(orderId, f) {
  await db().prepare(
    `UPDATE orders SET status = 'fulfilled',
         tracking_number = ?, tracking_carrier = ?, label_url = ?, updated_at = ? WHERE id = ?`
  ).bind(f.tracking, f.carrier, f.labelUrl, Date.now(), orderId).run();
}
export {
  setInvoiceId as a,
  getOrder as g,
  insertOrder as i,
  setFulfillment as s,
  updatePayment as u
};
