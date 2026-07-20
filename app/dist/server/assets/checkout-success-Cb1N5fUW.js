import { a3 as TSS_SERVER_FUNCTION, a5 as getServerFnById, a4 as createServerFn, r as reactExports, V as jsxRuntimeExports } from "./server-fospitwS.js";
import { u as useSearch, f as formatUsd, L as Link } from "./router-C37s80Ou.js";
import { c as clearCart, S as SiteLayout } from "./Chrome-kuQxIRGN.js";
import { o as object, b as string } from "./orders.server-DVmQ-msp.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "cloudflare:workers";
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const getOrderStatus = createServerFn({
  method: "GET"
}).inputValidator(object({
  id: string().min(1).max(40)
})).handler(createSsrRpc("3e225970265ca731cd1617a1ff3e08e3b988b9bd8e5797baff80e8296c6f3919"));
function Success() {
  const {
    order
  } = useSearch({
    from: "/checkout-success"
  });
  const [result, setResult] = reactExports.useState(null);
  const [loaded, setLoaded] = reactExports.useState(false);
  reactExports.useEffect(() => {
    clearCart();
    if (!order) {
      setLoaded(true);
      return;
    }
    let tries = 0;
    let timer;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await getOrderStatus({
          data: {
            id: order
          }
        });
        if (cancelled) return;
        setResult(res);
        setLoaded(true);
        const stillPending = res.found && (res.status === "pending" || res.status === "paid");
        if (stillPending && tries < 20) {
          tries += 1;
          timer = setTimeout(poll, 6e3);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    };
    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [order]);
  const o = result && result.found ? result : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(SiteLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pagehead wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "kicker", children: "Order received" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "disp", children: "Thank you." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { style: {
      paddingTop: 20
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wrap", style: {
      maxWidth: 680
    }, children: [
      !order ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "co-note", children: "No order reference found. If you just paid, your confirmation email will have the details." }) : !loaded ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "co-note", children: "Checking your order…" }) : !o ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "co-note", children: [
        "We couldn't find order ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: order }),
        " yet. If you completed payment, it may take a moment to register — refresh shortly."
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-summary", style: {
        position: "static"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Order" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: o.id })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `co-badge co-${o.status}`, children: [
            o.status === "pending" && "Payment confirming on-chain (~10–30 min)",
            o.status === "paid" && "Paid — preparing your shipment",
            o.status === "fulfilled" && "Paid & shipped",
            o.status === "failed" && "Payment failed",
            o.status === "expired" && "Invoice expired"
          ] })
        ] }),
        o.payCurrency ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Paid in" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: String(o.payCurrency).toUpperCase() })
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Subtotal" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatUsd(o.subtotalCents) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Shipping" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatUsd(o.shippingCents) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Tax" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatUsd(o.taxCents) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-row total", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Total" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatUsd(o.totalCents) })
        ] }),
        o.tracking ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Tracking" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            o.carrier ? o.carrier + " · " : "",
            o.tracking
          ] })
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "co-note", style: {
          marginTop: 18
        }, children: "A confirmation with these details is on its way to your email. Products ship lyophilized, room-temp, in plain unbranded packaging." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: {
        marginTop: 26
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/catalog", className: "btn", children: "Continue browsing" }) })
    ] }) })
  ] });
}
export {
  Success as component
};
