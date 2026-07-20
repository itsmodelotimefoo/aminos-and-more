// Server-only order reconciliation.
//
// The NOWPayments webhook (/api/ipn) is the FAST path for confirming payment.
// This module is the GUARANTEE: a scheduled sweep that re-checks orders which
// never reached a terminal state, so a single dropped callback can't leave a
// paid order unshipped.
//
// Both the webhook and the sweep funnel through advanceOrder(), so there is
// exactly one implementation of "what happens when an order is paid" and it is
// idempotent — running it twice never buys two labels.
import {
  getOrder,
  listStuckOrders,
  updatePayment,
  setFulfillment,
  type OrderRow,
} from "./orders.server";
import { getPaymentById, listRecentPayments, mapPaymentStatus } from "./nowpayments.server";
import { buyLabel } from "./shippo.server";

export type AdvanceResult = {
  orderId: string;
  from: string;
  to: string;
  fulfilled: boolean;
  note?: string;
};

/**
 * Apply a NOWPayments payment state to an order, then fulfil if newly paid.
 * Idempotent and safe to call repeatedly from any source.
 */
export async function advanceOrder(
  order: OrderRow,
  payment: {
    payment_id?: string | number | null;
    payment_status?: string | null;
    pay_currency?: string | null;
  },
): Promise<AdvanceResult> {
  const from = order.status;
  const paymentStatus = String(payment.payment_status ?? "");
  const mapped = mapPaymentStatus(paymentStatus);

  // Never regress a completed order — EXCEPT to record a refund. A refund can
  // legitimately land after shipping (chargeback / goodwill return); silently
  // dropping it would leave the books saying we were paid. Tracking columns are
  // untouched, so the shipment record survives the status change.
  if (order.status === "fulfilled" && mapped !== "refunded") {
    return { orderId: order.id, from, to: "fulfilled", fulfilled: true, note: "already fulfilled" };
  }

  await updatePayment(order.id, {
    status: mapped,
    npPaymentId: payment.payment_id != null ? String(payment.payment_id) : null,
    npPaymentStatus: paymentStatus || null,
    payCurrency: payment.pay_currency != null ? String(payment.pay_currency) : null,
  });

  // Buy the label only once, and only when we have a rate to buy against.
  const alreadyHasTracking = Boolean(order.tracking_number);
  if (mapped === "paid" && !alreadyHasTracking && order.shippo_rate_id) {
    try {
      const label = await buyLabel(order.shippo_rate_id);
      await setFulfillment(order.id, {
        carrier: label.carrier || order.ship_carrier || "",
        tracking: label.tracking,
        labelUrl: label.labelUrl,
      });
      return { orderId: order.id, from, to: "fulfilled", fulfilled: true };
    } catch (e) {
      // Stay 'paid' so the next sweep retries. Never lose the payment.
      console.error("[reconcile] label purchase failed for", order.id, e);
      return {
        orderId: order.id,
        from,
        to: mapped,
        fulfilled: false,
        note: "paid; label purchase failed, will retry",
      };
    }
  }

  return { orderId: order.id, from, to: mapped, fulfilled: false };
}

/** Convenience wrapper for the webhook, which only has an order id. */
export async function advanceOrderById(
  orderId: string,
  payment: Parameters<typeof advanceOrder>[1],
): Promise<AdvanceResult | null> {
  const order = await getOrder(orderId);
  if (!order) return null;
  return await advanceOrder(order, payment);
}

export type ReconcileSummary = {
  scanned: number;
  advanced: AdvanceResult[];
  errors: string[];
};

/**
 * Sweep stuck orders and re-check them against NOWPayments.
 *
 * minAgeMs — grace period so we don't fight the webhook on fresh orders.
 * maxAgeMs — ignore ancient rows (invoices expire; nothing to recover).
 */
export async function reconcileStuckOrders(opts?: {
  minAgeMs?: number;
  maxAgeMs?: number;
  limit?: number;
}): Promise<ReconcileSummary> {
  const minAgeMs = opts?.minAgeMs ?? 20 * 60 * 1000; // 20 min
  const maxAgeMs = opts?.maxAgeMs ?? 14 * 24 * 60 * 60 * 1000; // 14 days
  const limit = opts?.limit ?? 25;

  const summary: ReconcileSummary = { scanned: 0, advanced: [], errors: [] };

  let orders: OrderRow[] = [];
  try {
    orders = await listStuckOrders(minAgeMs, maxAgeMs, limit);
  } catch (e) {
    summary.errors.push(`listStuckOrders: ${msg(e)}`);
    return summary;
  }
  summary.scanned = orders.length;
  if (orders.length === 0) return summary;

  // Only pull the payments list if some order lacks a payment_id.
  let byOrderId: Map<string, any> | null = null;
  const needsList = orders.some((o) => !o.np_payment_id);
  if (needsList) {
    try {
      const payments = await listRecentPayments(100);
      byOrderId = new Map();
      for (const p of payments) {
        const oid = p?.order_id != null ? String(p.order_id) : "";
        if (!oid) continue;
        // Keep the most advanced record if an order has several attempts.
        const existing = byOrderId.get(oid);
        if (!existing || rank(p?.payment_status) > rank(existing?.payment_status)) {
          byOrderId.set(oid, p);
        }
      }
    } catch (e) {
      summary.errors.push(`listRecentPayments: ${msg(e)}`);
    }
  }

  for (const order of orders) {
    try {
      let payment: any = null;

      if (order.np_payment_id) {
        payment = await getPaymentById(order.np_payment_id);
      }
      if (!payment && byOrderId) {
        payment = byOrderId.get(order.id) ?? null;
      }

      // A 'paid' order with no tracking still needs fulfilment retried even if
      // the provider tells us nothing new.
      if (!payment) {
        if (order.status === "paid" && !order.tracking_number) {
          const r = await advanceOrder(order, {
            payment_id: order.np_payment_id,
            payment_status: order.np_payment_status ?? "confirmed",
            pay_currency: order.pay_currency,
          });
          if (r.fulfilled || r.note) summary.advanced.push(r);
        }
        continue;
      }

      const before = order.status;
      const result = await advanceOrder(order, payment);
      if (result.to !== before || result.fulfilled || result.note) {
        summary.advanced.push(result);
      }
    } catch (e) {
      summary.errors.push(`${order.id}: ${msg(e)}`);
    }
  }

  return summary;
}

// Ordering so the "most progressed" payment wins when an order has several.
function rank(status: unknown): number {
  switch (String(status)) {
    case "finished":
      return 6;
    case "confirmed":
      return 5;
    case "sending":
      return 4;
    case "confirming":
      return 3;
    case "partially_paid":
      return 2;
    case "waiting":
      return 1;
    default:
      return 0;
  }
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
