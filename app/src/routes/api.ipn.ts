import { createFileRoute } from "@tanstack/react-router";
import { verifyIpnSignature } from "../lib/nowpayments.server";
import { advanceOrderById } from "../lib/reconcile.server";

// NOWPayments Instant Payment Notification receiver — the FAST path for
// confirming payment. Verifies the HMAC-SHA512 signature, then hands off to the
// shared advanceOrder() path (also used by the scheduled reconciliation sweep),
// so "what happens when an order is paid" has exactly one implementation and is
// idempotent: repeated callbacks never buy a second label.
//
// Always returns 200 once the event is recorded so NOWPayments stops retrying.
// If a callback is ever dropped, the reconciliation cron recovers the order —
// confirmation does not depend on webhook delivery alone.
export const Route = createFileRoute("/api/ipn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const sig = request.headers.get("x-nowpayments-sig");
        const { ok, payload } = await verifyIpnSignature(raw, sig);
        if (!ok) {
          return new Response("invalid signature", { status: 401 });
        }

        const orderId = String(payload.order_id ?? "");
        if (!orderId) return new Response("ok", { status: 200 });

        try {
          const result = await advanceOrderById(orderId, {
            payment_id: payload.payment_id,
            payment_status: payload.payment_status,
            pay_currency: payload.pay_currency,
          });
          // Unknown order: ack anyway so NOWPayments stops retrying.
          if (result) {
            console.log(
              `[ipn] ${orderId} ${result.from} -> ${result.to}` +
                (result.note ? ` (${result.note})` : ""),
            );
          }
        } catch (e) {
          // Ack regardless: the reconciliation sweep will pick this order up.
          console.error("[ipn] failed to advance", orderId, e);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
