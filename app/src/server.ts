import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  // Scheduled reconciliation (Cron Trigger, see wrangler.jsonc "triggers").
  // Safety net so a dropped NOWPayments callback can never leave a paid order
  // unshipped: re-checks stuck orders and advances them through the same
  // idempotent path the webhook uses. No-ops quietly when payments aren't
  // configured yet.
  async scheduled(event: unknown, env: unknown, ctx: { waitUntil: (p: Promise<unknown>) => void }) {
    const run = (async () => {
      try {
        const { reconcileStuckOrders } = await import("./lib/reconcile.server");
        const summary = await reconcileStuckOrders();
        if (summary.scanned > 0 || summary.errors.length > 0) {
          console.log(
            `[reconcile] scanned=${summary.scanned} advanced=${summary.advanced.length} errors=${summary.errors.length}`,
          );
          for (const a of summary.advanced) {
            console.log(`[reconcile] ${a.orderId} ${a.from} -> ${a.to}${a.note ? ` (${a.note})` : ""}`);
          }
          for (const err of summary.errors) console.error(`[reconcile] ${err}`);
        }
      } catch (error) {
        console.error("[reconcile] sweep failed", error);
      }
    })();
    ctx?.waitUntil?.(run);
    await run;
  },

  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
