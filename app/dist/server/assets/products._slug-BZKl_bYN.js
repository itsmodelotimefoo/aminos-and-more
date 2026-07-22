import { a4 as createServerFn, r as reactExports, V as jsxRuntimeExports } from "./server-Bj_kDYFo.js";
import { c as createSsrRpc, b as Route, L as Link } from "./router-eXL63y7x.js";
import { S as SiteLayout, b as addLine, P as ProductCard } from "./Chrome-Cx_wkHeT.js";
import { L as LOW_STOCK } from "./catalog.server-CvWzbCZn.js";
import { o as object, s as string } from "./schemas-DZHoLM7f.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "cloudflare:workers";
import "./orders.server-CpHfpmGw.js";
const requestBackInStock = createServerFn({
  method: "POST"
}).inputValidator(object({
  slug: string().min(1).max(120),
  size: string().min(1).max(60),
  email: string().email().max(200)
})).handler(createSsrRpc("a3e16a209f42433c5051c4348b0a0f51912ea93ba633ed5bb1d9ea1f02fe9a48"));
function ProductPage() {
  const {
    slug
  } = Route.useParams();
  const {
    products,
    stock,
    sizeStock
  } = Route.useLoaderData();
  const p = products.find((x) => x.slug === slug);
  const [sizeIdx, setSizeIdx] = reactExports.useState(0);
  const [added, setAdded] = reactExports.useState(false);
  const [qty, setQty] = reactExports.useState(1);
  const sizeMap = p ? sizeStock[p.slug] : void 0;
  const availFor = (label) => sizeMap ? sizeMap[label] : p ? stock[p.slug] : void 0;
  reactExports.useEffect(() => {
    if (!p || !sizeMap) return;
    if ((sizeMap[p.sizes[sizeIdx][0]] ?? 1) > 0) return;
    const first = p.sizes.findIndex(([label]) => (sizeMap[label] ?? 1) > 0);
    if (first >= 0 && first !== sizeIdx) setSizeIdx(first);
  }, [slug, sizeMap]);
  if (!p) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(SiteLayout, { active: "catalog", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pagehead wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "kicker", children: "Not found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "disp", children: "No such compound." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/catalog", className: "btn", style: {
        marginTop: 18
      }, children: "Back to catalog" }) })
    ] }) });
  }
  const more = products.filter((x) => x.slug !== p.slug).slice(0, 3);
  const price = p.sizes[sizeIdx][1];
  const avail = availFor(p.sizes[sizeIdx][0]);
  const soldOut = (avail ?? 1) <= 0;
  const low = avail != null && avail > 0 && avail <= LOW_STOCK;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(SiteLayout, { active: "catalog", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wrap", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pdp", style: {
      "--accent": p.accent
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "media", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "glow" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: p.img, alt: p.name })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cls", children: p.cls }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "disp", children: p.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "blurb", children: p.blurb }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "kicker", style: {
          marginBottom: 8
        }, children: "Select size" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sizes", children: p.sizes.map(([label, amt], i) => {
          const sSold = (availFor(label) ?? 1) <= 0;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: `size${i === sizeIdx ? " sel" : ""}${sSold ? " soldout" : ""}`, style: sSold ? {
            opacity: 0.55
          } : void 0, onClick: () => {
            setSizeIdx(i);
            setAdded(false);
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mg", children: label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pr", children: sSold ? "Sold out" : `$${amt}` })
          ] }, label);
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "qtyrow", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "kicker", children: "Quantity" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "qtystep", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": "Decrease quantity", onClick: () => {
              setQty((q) => Math.max(1, q - 1));
              setAdded(false);
            }, children: "−" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: qty }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": "Increase quantity", onClick: () => {
              setQty((q) => Math.min(99, q + 1));
              setAdded(false);
            }, children: "+" })
          ] })
        ] }),
        low && !soldOut ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: {
          margin: "0 0 10px",
          color: "#e0902f",
          fontWeight: 600,
          fontSize: 13.5
        }, children: [
          "Only ",
          avail,
          " left in stock — order soon."
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn", style: {
          width: "100%",
          padding: 15,
          opacity: soldOut ? 0.55 : 1
        }, disabled: soldOut, onClick: () => {
          if (soldOut) return;
          addLine({
            slug: p.slug,
            name: p.name,
            size: p.sizes[sizeIdx][0],
            unitCents: price * 100,
            qty
          });
          setAdded(true);
        }, children: soldOut ? "Sold out" : added ? "Added to cart ✓" : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "cartline", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Add to cart",
            qty > 1 ? ` · ${qty}` : ""
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "$",
            price * qty
          ] })
        ] }) }),
        added ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: {
          marginTop: 10,
          textAlign: "center",
          fontSize: 13
        }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/checkout", style: {
          color: "var(--gold)"
        }, children: "View cart & check out →" }) }) : null,
        soldOut ? /* @__PURE__ */ jsxRuntimeExports.jsx(NotifyForm, { slug: p.slug, size: p.sizes[sizeIdx][0] }, p.sizes[sizeIdx][0]) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "meta", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Certificate of Analysis" }),
            " · published per lot (HPLC + mass spec)"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Formula" }),
            " ",
            p.formula,
            "  ·  ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "MW" }),
            " ",
            p.mw,
            " ",
            " ·  ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "CAS" }),
            " ",
            p.cas
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Storage" }),
            " room temp, lyophilized · ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "21+" }),
            " · For research use only"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      margin: "60px 0 20px"
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "kicker", children: "More from the cast" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cards", children: more.map((x) => /* @__PURE__ */ jsxRuntimeExports.jsx(ProductCard, { p: x }, x.slug)) })
  ] }) });
}
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
function NotifyForm({
  slug,
  size
}) {
  const [email, setEmail] = reactExports.useState("");
  const [status, setStatus] = reactExports.useState("idle");
  if (status === "done") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: {
      margin: "12px 0 0",
      textAlign: "center",
      fontSize: 13.5,
      color: "var(--gold)",
      fontWeight: 600
    }, children: [
      "✓ You're on the list — we'll email you the moment ",
      size,
      " is back."
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
    marginTop: 12
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: {
      margin: "0 0 8px",
      fontSize: 13.5,
      color: "var(--muted)"
    }, children: [
      "Out of stock. Get an email the moment ",
      size,
      " is back:"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { style: {
      display: "flex",
      gap: 8
    }, onSubmit: async (e) => {
      e.preventDefault();
      if (!EMAIL_RE.test(email)) {
        setStatus("error");
        return;
      }
      setStatus("sending");
      try {
        const r = await requestBackInStock({
          data: {
            slug,
            size,
            email
          }
        });
        setStatus(r.ok ? "done" : "error");
      } catch {
        setStatus("error");
      }
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", required: true, value: email, onChange: (e) => {
        setEmail(e.target.value);
        if (status === "error") setStatus("idle");
      }, placeholder: "you@email.com", "aria-label": `Email me when ${size} is back in stock`, style: {
        flex: 1,
        minWidth: 0,
        padding: "12px 13px",
        borderRadius: 8,
        border: "1px solid var(--line)",
        background: "var(--bg2)",
        color: "var(--cream)",
        fontSize: 14,
        fontFamily: "inherit"
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", className: "btn ghost", style: {
        flex: "0 0 auto",
        padding: "12px 18px"
      }, disabled: status === "sending", children: status === "sending" ? "…" : "Notify me" })
    ] }),
    status === "error" ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: {
      margin: "8px 0 0",
      fontSize: 12.5,
      color: "var(--crimson)"
    }, children: "Enter a valid email and try again." }) : null
  ] });
}
export {
  ProductPage as component
};
