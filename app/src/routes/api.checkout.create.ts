import { createFileRoute } from "@tanstack/react-router";
import { createOrderSchema, subtotalCents, type CartLine } from "../lib/checkout";
import { estimateTaxCents } from "../lib/tax";
import { getProduct } from "../lib/products";
import { insertOrder, setInvoiceId } from "../lib/orders.server";
import { createInvoice } from "../lib/nowpayments.server";

export const Route = createFileRoute("/api/checkout/create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON." }, 400);
        }
        const parsed = createOrderSchema.safeParse(body);
        if (!parsed.success) {
          return json(
            { error: "Please confirm 21+ / researcher certification and complete every field." },
            400,
          );
        }
        const d = parsed.data;

        // Re-price every line from the authoritative catalog (never trust the
        // client's prices).
        const priced: CartLine[] = [];
        for (const item of d.items) {
          const product = getProduct(item.slug);
          if (!product) return json({ error: `Unknown item: ${item.slug}.` }, 400);
          const size = product.sizes.find((s) => s[0] === item.size);
          if (!size) return json({ error: `Invalid size for ${product.name}.` }, 400);
          priced.push({
            slug: product.slug,
            name: product.name,
            size: size[0],
            unitCents: size[1] * 100,
            qty: item.qty,
          });
        }

        const subtotal = subtotalCents(priced);
        const tax = estimateTaxCents(subtotal, d.address.state, d.address.country);
        const total = subtotal + d.shippingCents + tax;
        const orderId = "AM-" + crypto.randomUUID().slice(0, 8).toUpperCase();
        const origin = new URL(request.url).origin;

        try {
          await insertOrder({
            id: orderId,
            email: d.email,
            items: priced,
            subtotalCents: subtotal,
            shippingCents: d.shippingCents,
            taxCents: tax,
            totalCents: total,
            certified21: d.certified21,
            certifiedResearcher: d.certifiedResearcher,
            ship: {
              name: d.address.name,
              street1: d.address.street1,
              street2: d.address.street2 ?? "",
              city: d.address.city,
              state: d.address.state,
              zip: d.address.zip,
              country: d.address.country,
              phone: d.address.phone ?? "",
            },
            shippoRateId: d.shippoRateId,
            carrier: d.carrier,
            service: d.service,
          });

          const invoice = await createInvoice({
            orderId,
            amountCents: total,
            description: `Aminos & More order ${orderId}`,
            ipnUrl: `${origin}/api/ipn`,
            successUrl: `${origin}/checkout-success?order=${orderId}`,
            cancelUrl: `${origin}/checkout?canceled=1`,
          });
          await setInvoiceId(orderId, invoice.invoiceId);

          return json({ orderId, invoiceUrl: invoice.invoiceUrl });
        } catch (e) {
          return json({ error: e instanceof Error ? e.message : "Checkout failed." }, 502);
        }
      },
    },
  },
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
