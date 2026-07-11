import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getOrder } from "../orders.server";
import type { CartLine } from "../checkout";

// Public order-status lookup for the success page. Returns only non-sensitive
// fields (no full address).
export const getOrderStatus = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().min(1).max(40) }))
  .handler(async ({ data }) => {
    const o = await getOrder(data.id);
    if (!o) return { found: false as const };
    let items: CartLine[] = [];
    try {
      items = JSON.parse(o.items_json) as CartLine[];
    } catch {
      items = [];
    }
    return {
      found: true as const,
      id: o.id,
      status: o.status,
      paymentStatus: o.np_payment_status,
      payCurrency: o.pay_currency,
      totalCents: o.total_cents,
      subtotalCents: o.subtotal_cents,
      shippingCents: o.shipping_cents,
      taxCents: o.tax_cents,
      carrier: o.ship_carrier,
      service: o.ship_service,
      tracking: o.tracking_number,
      items,
    };
  });
