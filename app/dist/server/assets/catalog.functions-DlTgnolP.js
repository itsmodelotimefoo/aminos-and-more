import { c as createServerRpc } from "./createServerRpc-DoQ8Diqk.js";
import { a4 as createServerFn } from "./server-Bj_kDYFo.js";
import { g as getCatalog, b as getStock, c as getSizeStock } from "./catalog.server-CvWzbCZn.js";
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
const loadStock_createServerFn_handler = createServerRpc({
  id: "be416dbfa6eb196f1fbb3091655c95c73fe5e459d6de110e5879dd99c1aec864",
  name: "loadStock",
  filename: "src/lib/api/catalog.functions.ts"
}, (opts) => loadStock.__executeServer(opts));
const loadStock = createServerFn({
  method: "GET"
}).handler(loadStock_createServerFn_handler, async () => {
  return await getStock();
});
const loadSizeStock_createServerFn_handler = createServerRpc({
  id: "c95b7f9f1d39da392830c397681f8244027e4ae04e50b455956f6044debc1464",
  name: "loadSizeStock",
  filename: "src/lib/api/catalog.functions.ts"
}, (opts) => loadSizeStock.__executeServer(opts));
const loadSizeStock = createServerFn({
  method: "GET"
}).handler(loadSizeStock_createServerFn_handler, async () => {
  return await getSizeStock();
});
export {
  loadCatalog_createServerFn_handler,
  loadSizeStock_createServerFn_handler,
  loadStock_createServerFn_handler
};
