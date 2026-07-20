import { a3 as TSS_SERVER_FUNCTION, a4 as createServerFn } from "./server-3boKDppH.js";
import { o as object, b as string, g as getOrder } from "./orders.server-DVmQ-msp.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "cloudflare:workers";
var createServerRpc = (serverFnMeta, splitImportFn) => {
  const url = "/_serverFn/" + serverFnMeta.id;
  return Object.assign(splitImportFn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const getOrderStatus_createServerFn_handler = createServerRpc({
  id: "3e225970265ca731cd1617a1ff3e08e3b988b9bd8e5797baff80e8296c6f3919",
  name: "getOrderStatus",
  filename: "src/lib/api/orders.functions.ts"
}, (opts) => getOrderStatus.__executeServer(opts));
const getOrderStatus = createServerFn({
  method: "GET"
}).inputValidator(object({
  id: string().min(1).max(40)
})).handler(getOrderStatus_createServerFn_handler, async ({
  data
}) => {
  const o = await getOrder(data.id);
  if (!o) return {
    found: false
  };
  let items = [];
  try {
    items = JSON.parse(o.items_json);
  } catch {
    items = [];
  }
  return {
    found: true,
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
    items
  };
});
export {
  getOrderStatus_createServerFn_handler
};
