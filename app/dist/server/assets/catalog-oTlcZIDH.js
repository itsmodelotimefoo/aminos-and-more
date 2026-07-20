import { r as reactExports, V as jsxRuntimeExports } from "./server-BwwNE6Rr.js";
import { S as SiteLayout, P as ProductCard } from "./Chrome-1M4XhM36.js";
import { R as Route } from "./router-CDSweWN3.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "./catalog.server-DqFAIc20.js";
import "cloudflare:workers";
import "./orders.server-DVmQ-msp.js";
const FILTERS = [{
  k: "all",
  label: "All"
}, {
  k: "peptide",
  label: "Compounds"
}, {
  k: "duo",
  label: "Duos"
}, {
  k: "blend",
  label: "Blends"
}];
function Catalog() {
  const {
    products
  } = Route.useLoaderData();
  const [sel, setSel] = reactExports.useState("all");
  const shown = products.filter((p) => sel === "all" || p.kind === sel);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(SiteLayout, { active: "catalog", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pagehead wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "kicker", children: "The Cast · Full Catalog" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "disp", children: "Shop the vault." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Every SKU independently tested and published by lot." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { style: {
      paddingTop: 30
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "filters", children: FILTERS.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: sel === f.k ? "sel" : "", onClick: () => setSel(f.k), children: f.label }, f.k)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cards", children: shown.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(ProductCard, { p }, p.slug)) })
    ] }) })
  ] });
}
export {
  Catalog as component
};
