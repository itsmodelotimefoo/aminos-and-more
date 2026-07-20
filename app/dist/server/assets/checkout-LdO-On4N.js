import { r as reactExports, V as jsxRuntimeExports } from "./server-fospitwS.js";
import { s as subtotalCents, e as estimateTaxCents, t as taxRateFor, L as Link, f as formatUsd } from "./router-C37s80Ou.js";
import { u as useCart, S as SiteLayout, a as updateQty, r as removeLine } from "./Chrome-kuQxIRGN.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "cloudflare:workers";
import "./orders.server-DVmQ-msp.js";
const EMPTY_ADDR = {
  name: "",
  street1: "",
  street2: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  phone: ""
};
function Checkout() {
  const {
    lines
  } = useCart();
  const [cert21, setCert21] = reactExports.useState(false);
  const [certRes, setCertRes] = reactExports.useState(false);
  const [email, setEmail] = reactExports.useState("");
  const [addr, setAddr] = reactExports.useState(EMPTY_ADDR);
  const [rates, setRates] = reactExports.useState(null);
  const [rateId, setRateId] = reactExports.useState("");
  const [loadingRates, setLoadingRates] = reactExports.useState(false);
  const [placing, setPlacing] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const subtotal = subtotalCents(lines);
  const chosen = rates?.find((r) => r.rateId === rateId) ?? null;
  const taxCents = estimateTaxCents(subtotal, addr.state, addr.country);
  const taxRate = taxRateFor(addr.state, addr.country);
  const total = subtotal + (chosen?.amountCents ?? 0) + taxCents;
  const addrComplete = addr.name && addr.street1 && addr.city && addr.state && addr.zip && addr.country;
  const gatePassed = cert21 && certRes;
  const canGetRates = Boolean(gatePassed && email && addrComplete && lines.length);
  function setField(k, v) {
    setAddr((a) => ({
      ...a,
      [k]: v
    }));
    setRates(null);
    setRateId("");
  }
  async function getRates() {
    setError("");
    setLoadingRates(true);
    setRates(null);
    setRateId("");
    try {
      const res = await fetch("/api/checkout/rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          address: addr,
          items: lines
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not get shipping rates.");
      setRates(data.rates);
      if (data.rates?.[0]) setRateId(data.rates[0].rateId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not get shipping rates.");
    } finally {
      setLoadingRates(false);
    }
  }
  async function pay() {
    if (!chosen) return;
    setError("");
    setPlacing(true);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          address: addr,
          items: lines,
          shippoRateId: chosen.rateId,
          shippingCents: chosen.amountCents,
          carrier: chosen.carrier,
          service: chosen.service,
          certified21: cert21,
          certifiedResearcher: certRes
        })
      });
      const data = await res.json();
      if (!res.ok || !data.invoiceUrl) {
        throw new Error(data.error || "Could not start payment.");
      }
      window.location.href = data.invoiceUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start payment.");
      setPlacing(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(SiteLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pagehead wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "kicker", children: "Checkout" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "disp", children: "Your cart." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { style: {
      paddingTop: 20
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "wrap", children: lines.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-empty", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Your cart is empty." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/catalog", className: "btn", style: {
        marginTop: 16
      }, children: "Browse the catalog" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-grid", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "co-lines", children: lines.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-line", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "co-name", children: l.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-sub", children: [
              l.size,
              " · ",
              formatUsd(l.unitCents),
              " each"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-qtywrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": "Decrease", onClick: () => updateQty(l.slug, l.size, l.qty - 1), children: "−" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: l.qty }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": "Increase", onClick: () => updateQty(l.slug, l.size, l.qty + 1), children: "+" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "co-lineprice", children: formatUsd(l.unitCents * l.qty) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "co-remove", "aria-label": "Remove", onClick: () => removeLine(l.slug, l.size), children: "✕" })
        ] }, l.slug + l.size)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "co-h", children: "Researcher certification" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "gate", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: cert21, onChange: (e) => setCert21(e.target.checked) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "I certify I am 21 years of age or older." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "gate", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: certRes, onChange: (e) => setCertRes(e.target.checked) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "I am a qualified researcher and understand these products are for research use only — not for human or veterinary use." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "co-h", children: "Shipping" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-form", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "co-in wide", placeholder: "Full name", value: addr.name, onChange: (e) => setField("name", e.target.value) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "co-in wide", placeholder: "Street address", value: addr.street1, onChange: (e) => setField("street1", e.target.value) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "co-in wide", placeholder: "Apt, suite (optional)", value: addr.street2, onChange: (e) => setField("street2", e.target.value) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "co-in", placeholder: "City", value: addr.city, onChange: (e) => setField("city", e.target.value) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "co-in", placeholder: "State / province", value: addr.state, onChange: (e) => setField("state", e.target.value) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "co-in", placeholder: "ZIP / postal code", value: addr.zip, onChange: (e) => setField("zip", e.target.value) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "co-in", placeholder: "Country (ISO-2, e.g. US)", maxLength: 2, value: addr.country, onChange: (e) => setField("country", e.target.value.toUpperCase()) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "co-in wide", type: "email", placeholder: "Email (for order + tracking)", value: email, onChange: (e) => setEmail(e.target.value) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "co-in wide", placeholder: "Phone (optional)", value: addr.phone, onChange: (e) => setField("phone", e.target.value) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn ghost", style: {
          marginTop: 16
        }, disabled: !canGetRates || loadingRates, onClick: getRates, children: loadingRates ? "Getting rates…" : "Get shipping rates" }),
        !gatePassed ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "co-hint", children: "Confirm both certifications to continue." }) : null,
        rates && rates.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-rates", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "co-h", children: "Choose shipping" }),
          rates.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: `co-rate${rateId === r.rateId ? " sel" : ""}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "radio", name: "rate", checked: rateId === r.rateId, onChange: () => setRateId(r.rateId) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "co-rate-name", children: [
              r.carrier,
              " · ",
              r.service,
              r.estDays ? ` · ~${r.estDays} day${r.estDays > 1 ? "s" : ""}` : ""
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "co-rate-price", children: formatUsd(r.amountCents) })
          ] }, r.rateId))
        ] }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "co-summary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "co-h", style: {
          marginTop: 0
        }, children: "Order summary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Subtotal" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatUsd(subtotal) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Shipping" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: chosen ? formatUsd(chosen.amountCents) : "—" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Estimated tax",
            taxRate > 0 ? ` (${taxRate}%)` : ""
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: taxCents > 0 ? formatUsd(taxCents) : "—" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "co-row total", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Total" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatUsd(total) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn", style: {
          width: "100%",
          padding: 15,
          marginTop: 8
        }, disabled: !chosen || placing, onClick: pay, children: placing ? "Starting payment…" : "Pay with crypto" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "co-pay", children: "Pay in BTC, USDT (TRC-20) or ETH via NOWPayments. BTC confirms on-chain in ~10–30 min. You'll be redirected to a secure invoice." }),
        error ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "co-error", children: error }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "co-ruo", children: "Research use only · not for human or veterinary use · 21+." })
      ] })
    ] }) }) })
  ] });
}
export {
  Checkout as component
};
