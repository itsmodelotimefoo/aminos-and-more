import { V as jsxRuntimeExports } from "./server-C0CyT6Iu.js";
import { L as Link, P as PRODUCTS } from "./router-Dne-IJ2b.js";
import { S as SiteLayout, M as Marquee, P as ProductCard } from "./Chrome-3lGoYxxB.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "cloudflare:workers";
import "./orders.server-DVmQ-msp.js";
function Index() {
  const featured = PRODUCTS.slice(0, 6);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(SiteLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "hero", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wrap grid", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "kicker", children: "Independent lab-tested · Published by lot" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "disp", children: [
          "Tested by lot.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "amp", children: "&" }),
          " built",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "for trust."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "lede", children: "Premium research compounds with the receipts to match. Every batch verified by an independent accredited lab — every result published, matched to the lot on your vial." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cta", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/catalog", className: "btn", children: "Explore the catalog" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/testing", className: "btn ghost", children: "See the testing" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stats", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "gold-text", children: "≥98%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Purity standard" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "gold-text", children: "100%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Batches published" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "gold-text", children: "1:1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "CoA per lot" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "heroimg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/products/ghk-cu.png", alt: "Aminos & More GHK-Cu hero vial" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Marquee, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "head", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "kicker", children: "The Cast" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "disp", children: [
          "Every compound,",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "its own character."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Drawn from what the molecule actually does. The art tells the mechanism; the label tells the truth." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cards", children: featured.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(ProductCard, { p }, p.slug)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "center", style: {
        marginTop: 34
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/catalog", className: "btn", children: "See the full catalog →" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { style: {
      background: "var(--bg2)",
      borderTop: "1px solid var(--line)",
      borderBottom: "1px solid var(--line)"
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "head", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "kicker", children: "How it works" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "disp", children: "Bench to bench." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "steps", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "step", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "n", children: "01" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "Source" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Vetted suppliers, held to a ≥98% purity standard." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "step", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "n", children: "02" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "Test" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Every lot to an independent accredited lab — HPLC + mass spec." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "step", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "n", children: "03" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "Publish" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "The full CoA posted and tied to the lot number." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "step", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "n", children: "04" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "Ship" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Lyophilized, room-temp stable, discreetly packaged." })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Index as component
};
