import { r as reactExports, V as jsxRuntimeExports } from "./server-CnJ7KbaK.js";
import { S as SiteLayout } from "./Chrome-BO1Gz7ua.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "./router-Duj6h01X.js";
import "./catalog.server-C18DQUTb.js";
import "cloudflare:workers";
import "./orders.server-DVmQ-msp.js";
function Join() {
  const [email, setEmail] = reactExports.useState("");
  const [is21, setIs21] = reactExports.useState(false);
  const [joined, setJoined] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(SiteLayout, { active: "join", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pagehead wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "kicker", children: "Join the Club" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "disp", children: "Be first to every drop." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "join", style: {
      paddingTop: 20
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "box", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "kicker", children: "Members only" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "disp", children: "New lots. Fresh reports." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "New lots, fresh lab reports, members-only access. No spam — just proof and product." }),
      joined ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "joined", children: "YOU'RE ON THE LIST. WELCOME TO THE CLUB." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "form", onSubmit: (e) => {
        e.preventDefault();
        if (is21 && email) setJoined(true);
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", placeholder: "you@email.com", required: true, "aria-label": "Email", value: email, onChange: (e) => setEmail(e.target.value) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", className: "btn", disabled: !is21 || !email, children: "Join" })
      ] }),
      !joined ? /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "gate", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: is21, onChange: (e) => setIs21(e.target.checked) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "I certify I am 21 years of age or older and a qualified researcher. I understand all products are for research use only — not for human or veterinary use." })
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: {
        fontSize: 12,
        marginTop: 16,
        color: "var(--muted)"
      }, children: "By joining you agree to our terms. This is a placeholder capture form for client review — no data is stored." })
    ] }) }) })
  ] });
}
export {
  Join as component
};
