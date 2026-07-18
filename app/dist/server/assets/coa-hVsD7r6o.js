import { V as jsxRuntimeExports } from "./server-DDGRuMda.js";
import { L as Link } from "./router-Xof-El1P.js";
import { S as SiteLayout } from "./Chrome-DHNgVr-P.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "cloudflare:workers";
import "./orders.server-DVmQ-msp.js";
function Coa() {
  function onLookup(e) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("lot");
    const lot = input?.value.trim();
    if (!lot) return;
    window.location.href = "mailto:coa@aminosandmore.com?subject=" + encodeURIComponent("CoA request — Lot " + lot) + "&body=" + encodeURIComponent("Please send the Certificate of Analysis for lot " + lot + ".");
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(SiteLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pagehead wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "kicker", children: "Certificates of Analysis" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "disp", children: [
        "Read the report.",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "Check the lot."
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { style: {
      paddingTop: 20
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "prose", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Every lot we release is tested for identity and purity by an independent, accredited lab, and the Certificate of Analysis is published and tied to the lot number printed on your vial. No inflated claims — just the report." }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lookup", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lbl", children: "Look up a lot" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: onLookup, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { id: "lot", name: "lot", type: "text", placeholder: "Lot number from your vial (e.g. AM-XXXX)", "aria-label": "Lot number", required: true }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn", type: "submit", children: "Request CoA" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: "Enter the lot number and we'll email you the exact Certificate of Analysis for that batch. The current lot's CoA is also linked on each product page." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "three", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "b", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "n", children: "01" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "Find your lot" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "The lot number is printed on the vial label and shown on your order." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "b", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "n", children: "02" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "Match the report" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Each CoA lists only the tests that lot received — identity (mass spec) and purity (HPLC)." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "b", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "n", children: "03" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "Decide for yourself" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "That's the whole promise. Tested by lot, published by lot." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "prose", style: {
        marginTop: 44
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "Can't find a lot?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
          "Email",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "mailto:coa@aminosandmore.com", style: {
            color: "var(--gold)"
          }, children: "coa@aminosandmore.com" }),
          " ",
          "with your lot or order number and we'll send the report."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: {
          marginTop: 26
        }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/catalog", className: "btn", children: "Browse tested lots" }) })
      ] })
    ] }) })
  ] });
}
export {
  Coa as component
};
