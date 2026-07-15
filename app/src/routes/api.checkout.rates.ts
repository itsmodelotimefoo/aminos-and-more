import { createFileRoute } from "@tanstack/react-router";
import { ratesRequestSchema } from "../lib/checkout";
import { getRates } from "../lib/shippo.server";

export const Route = createFileRoute("/api/checkout/rates")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON." }, 400);
        }
        const parsed = ratesRequestSchema.safeParse(body);
        if (!parsed.success) {
          return json({ error: "Invalid address or cart." }, 400);
        }
        try {
          const rates = await getRates(parsed.data.address, parsed.data.items);
          if (rates.length === 0) {
            return json({ error: "No shipping rates available for that address." }, 422);
          }
          return json({ rates });
        } catch (e) {
          return json({ error: messageOf(e) }, 502);
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

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : "Shipping rate lookup failed.";
}
