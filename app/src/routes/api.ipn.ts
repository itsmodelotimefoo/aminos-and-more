import { createFileRoute } from "@tanstack/react-router";
import { verifyIpnSignature, mapPaymentStatus } from "../lib/nowpayments.server";
import { getOrder, updatePayment, setFulfillment } from "../lib/orders.server";
import { buyLabel } from "../lib/shippo.server";

// NOWPayments Instant Payment Notification receiver. Verifies the HMAC-SHA512
// signature, flips the order to paid, and — on first confirmation — buys the
// Shippo label and stores tracking. Idempotent: repeated callbacks won't
// re-purchase a label. Always returns 200 once we've recorded the event so
// NOWPayments stops retrying.
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
        const order = orderId ? await getOrder(orderId) : null;
        if (!order) {
          // Nothing to update, but ack so NOWPayments stops retrying.
          return new Response("ok", { status: 200 });
        }

        const paymentStatus = String(payload.payment_status ?? "");
        const mapped = mapPaymentStatus(paymentStatus);

        // Don't downgrade an already-fulfilled order.
        if (order.status !== "fulfilled") {
          await updatePayment(orderId, {
            status: mapped,
            npPaymentId: payload.payment_id != null ? String(payload.payment_id) : null,
            npPaymentStatus: paymentStatus || null,
            payCurrency: payload.pay_currency != null ? String(payload.pay_currency) : null,
          });
        }

        // First time we see it paid → buy the label + fulfill.
        if (mapped === "paid" && order.status !== "fulfilled" && order.shippo_rate_id) {
          try {
            const label = await buyLabel(order.shippo_rate_id);
            await setFulfillment(orderId, {
              carrier: label.carrier || order.ship_carrier || "",
              tracking: label.tracking,
              labelUrl: label.labelUrl,
            });
            // NOTE: transactional confirmation email is not wired — no email
            // provider is configured. The order + tracking are stored; the
            // buyer sees status on /checkout-success. Add an email provider
            // (e.g. Resend/Postmark) here to send the confirmation.
          } catch (e) {
            console.error("Shippo label purchase failed for", orderId, e);
            // Leave the order 'paid'; label can be retried from the dashboard.
          }
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
