import { c as createServerRpc } from "./createServerRpc-DoQ8Diqk.js";
import { a4 as createServerFn } from "./server-Bj_kDYFo.js";
import { env } from "cloudflare:workers";
import { o as object, s as string } from "./schemas-DZHoLM7f.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
function cfg() {
  const e = env;
  const url = e.SUPABASE_URL;
  const key = e.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key, store: e.STORE_SLUG || "aminos" };
}
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
async function notifyBackInStock(input) {
  const slug = (input.slug || "").trim().slice(0, 120);
  const size = (input.size || "").trim().slice(0, 60);
  const email = (input.email || "").trim().toLowerCase().slice(0, 200);
  if (!slug || !size || !EMAIL_RE.test(email)) return { ok: false };
  const c = cfg();
  if (!c) return { ok: false };
  try {
    const res = await fetch(`${c.url}/rest/v1/stock_notify?on_conflict=slug,size,email`, {
      method: "POST",
      headers: {
        apikey: c.key,
        Authorization: `Bearer ${c.key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify({ slug, size, email, store_slug: c.store, notified: false })
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
const requestBackInStock_createServerFn_handler = createServerRpc({
  id: "a3e16a209f42433c5051c4348b0a0f51912ea93ba633ed5bb1d9ea1f02fe9a48",
  name: "requestBackInStock",
  filename: "src/lib/api/notify.functions.ts"
}, (opts) => requestBackInStock.__executeServer(opts));
const requestBackInStock = createServerFn({
  method: "POST"
}).inputValidator(object({
  slug: string().min(1).max(120),
  size: string().min(1).max(60),
  email: string().email().max(200)
})).handler(requestBackInStock_createServerFn_handler, async ({
  data
}) => {
  return await notifyBackInStock(data);
});
export {
  requestBackInStock_createServerFn_handler
};
