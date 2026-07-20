import { c as createServerRpc } from "./createServerRpc-CsI-UfVU.js";
import { a4 as createServerFn } from "./server-BwwNE6Rr.js";
import { g as getCatalog } from "./catalog.server-DqFAIc20.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "cloudflare:workers";
const loadCatalog_createServerFn_handler = createServerRpc({
  id: "686ff7164d897b62df803ae23901282e0589041c96e71e92ff6bc89da3f757e8",
  name: "loadCatalog",
  filename: "src/lib/api/catalog.functions.ts"
}, (opts) => loadCatalog.__executeServer(opts));
const loadCatalog = createServerFn({
  method: "GET"
}).handler(loadCatalog_createServerFn_handler, async () => {
  return await getCatalog();
});
export {
  loadCatalog_createServerFn_handler
};
