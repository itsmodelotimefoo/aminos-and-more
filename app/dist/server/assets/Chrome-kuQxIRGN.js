import { r as reactExports, V as jsxRuntimeExports } from "./server-fospitwS.js";
import { L as Link, a as fromPrice } from "./router-C37s80Ou.js";
const KEY = "am_cart_v1";
const EVENT = "am-cart-change";
function isBrowser() {
  return typeof window !== "undefined";
}
function readCart() {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function writeCart(lines) {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent(EVENT));
}
function addLine(line) {
  const lines = readCart();
  const existing = lines.find((l) => l.slug === line.slug && l.size === line.size);
  if (existing) {
    existing.qty = Math.min(99, existing.qty + line.qty);
  } else {
    lines.push({ ...line, qty: Math.min(99, line.qty) });
  }
  writeCart(lines);
}
function updateQty(slug, size, qty) {
  let lines = readCart();
  if (qty <= 0) {
    lines = lines.filter((l) => !(l.slug === slug && l.size === size));
  } else {
    const l = lines.find((x) => x.slug === slug && x.size === size);
    if (l) l.qty = Math.min(99, qty);
  }
  writeCart(lines);
}
function removeLine(slug, size) {
  writeCart(readCart().filter((l) => !(l.slug === slug && l.size === size)));
}
function clearCart() {
  writeCart([]);
}
function useCart() {
  const [lines, setLines] = reactExports.useState([]);
  reactExports.useEffect(() => {
    const sync = () => setLines(readCart());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  return { lines, count };
}
const AGE_KEY = "am_age_ok";
function AgeGate() {
  const [open, setOpen] = reactExports.useState(true);
  const [declined, setDeclined] = reactExports.useState(false);
  reactExports.useEffect(() => {
    try {
      if (window.localStorage.getItem(AGE_KEY) === "1") setOpen(false);
    } catch {
    }
  }, []);
  if (!open) return null;
  function enter() {
    try {
      window.localStorage.setItem(AGE_KEY, "1");
    } catch {
    }
    setOpen(false);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "am-gate", role: "dialog", "aria-modal": "true", "aria-label": "Age verification", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "am-gate-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "brand", children: [
      "AMINOS",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "&" }),
      "MORE"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "agebadge", children: "21+ · Research use only" }),
    declined ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "disp", children: "Access restricted." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "You must be 21 or older to enter. These materials are for laboratory and research use only — not for human or veterinary use." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "am-gate-actions", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn ghost", onClick: () => setDeclined(false), children: "Go back" }) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "disp", children: "Before you enter." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
        "The products on this site are research compounds for laboratory use only —",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "not for human or veterinary use" }),
        ". By entering you confirm you are",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "21 or older" }),
        " and a qualified researcher accessing this material for research purposes."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "am-gate-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn", onClick: enter, children: "I am 21+ · Enter" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn ghost", onClick: () => setDeclined(true), children: "Leave" })
      ] })
    ] })
  ] }) });
}
function Nav({ active }) {
  const { count } = useCart();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wrap row", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "brand", children: [
      "AMINOS",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "&" }),
      "MORE"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "links", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/catalog", className: active === "catalog" ? "active" : "", children: "Catalog" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/testing", className: active === "testing" ? "active" : "", children: "Testing" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/about", className: active === "about" ? "active" : "", children: "About" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/join", className: active === "join" ? "active" : "", children: "Join" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/checkout", className: "btn", children: [
      "Cart",
      count > 0 ? ` · ${count}` : ""
    ] })
  ] }) });
}
function Marquee() {
  const items = [
    ["HPLC + MASS SPEC", true],
    ["PUBLISHED BY LOT", false],
    ["ROOM-TEMP STABLE", false],
    ["TESTED BY LOT", true],
    ["INDEPENDENT LABS", false]
  ];
  const loop = [...items, ...items];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "marq", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "track", children: loop.map(([label, bold], i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
    bold ? /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: label }) : label,
    " ·"
  ] }, i)) }) });
}
function ProductCard({ p }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Link,
    {
      to: "/products/$slug",
      params: { slug: p.slug },
      className: "card",
      style: { "--accent": p.accent },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "imgwrap", children: [
          p.tag ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tag", children: p.tag }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "glow" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { loading: "lazy", decoding: "async", src: p.img, alt: p.name })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "body", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cls", children: p.cls }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "r", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: p.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "price", children: fromPrice(p) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "coa", children: "CoA published by lot" })
        ] })
      ]
    }
  );
}
function Footer() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wrap", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cols", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "brand", children: [
          "AMINOS",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "&" }),
          "MORE"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { marginTop: 12, maxWidth: "36ch" }, children: "Premium research compounds. Independently tested. Published by lot." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "kicker", style: { marginBottom: 10 }, children: "Explore" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/catalog", children: "Catalog" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/testing", children: "Testing" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/about", children: "About" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/join", children: "Join" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "kicker", style: { marginBottom: 10 }, children: "Company" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/coa", children: "Certificates of Analysis" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/contact", children: "Contact" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/terms", children: "Terms & Privacy" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "disc", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "agebadge", children: "21+ ONLY" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "For research and laboratory use only." }),
      " Products are not intended to diagnose, treat, cure, or prevent any disease, and are not for human or veterinary consumption. Not a dietary supplement or drug. All purchasers must certify they are qualified and 21 years of age or older. © 2026 Aminos & More.",
      /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("em", { children: "Product imagery is AI-generated concept art and does not depict actual product." })
    ] })
  ] }) });
}
function SiteLayout({
  active,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "am", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "am-bg", "aria-hidden": "true" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AgeGate, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Nav, { active }),
    children,
    /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {})
  ] });
}
export {
  Marquee as M,
  ProductCard as P,
  SiteLayout as S,
  updateQty as a,
  addLine as b,
  clearCart as c,
  removeLine as r,
  useCart as u
};
