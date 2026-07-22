import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { SiteLayout, ProductCard } from "../components/site/Chrome";
import { getProduct, LOW_STOCK } from "../lib/products";
import { loadCatalog, loadStock, loadSizeStock } from "../lib/api/catalog.functions";
import { requestBackInStock } from "../lib/api/notify.functions";
import { addLine } from "../lib/cart";

export const Route = createFileRoute("/products/$slug")({
  loader: async () => ({
    products: await loadCatalog(),
    stock: await loadStock(),
    sizeStock: await loadSizeStock(),
  }),
  head: ({ params }) => {
    // Meta uses the static catalog (head is sync); the body renders the live one.
    const p = getProduct(params.slug);
    const name = p ? p.name : "Product";
    return {
      meta: [
        { title: `${name} — Aminos & More` },
        {
          name: "description",
          content: p
            ? `${p.name} · ${p.cls}. Certificate of Analysis published by lot. Research use only.`
            : "Aminos & More research compound.",
        },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { products, stock, sizeStock } = Route.useLoaderData();
  const p = products.find((x) => x.slug === slug);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  // Per-size availability for this product (SIZE_STOCK on). When absent, availFor
  // falls back to product-level stock — exactly today's behavior.
  const sizeMap = p ? sizeStock[p.slug] : undefined;
  const availFor = (label: string): number | undefined =>
    sizeMap ? sizeMap[label] : p ? stock[p.slug] : undefined;

  // Land on the first in-stock size so a customer doesn't open to a sold-out one.
  useEffect(() => {
    if (!p || !sizeMap) return;
    if ((sizeMap[p.sizes[sizeIdx][0]] ?? 1) > 0) return; // current size is fine
    const first = p.sizes.findIndex(([label]) => (sizeMap[label] ?? 1) > 0);
    if (first >= 0 && first !== sizeIdx) setSizeIdx(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, sizeMap]);

  if (!p) {
    return (
      <SiteLayout active="catalog">
        <div className="pagehead wrap">
          <div className="kicker">Not found</div>
          <h1 className="disp">No such compound.</h1>
          <p>
            <Link to="/catalog" className="btn" style={{ marginTop: 18 }}>
              Back to catalog
            </Link>
          </p>
        </div>
      </SiteLayout>
    );
  }

  const more = products.filter((x) => x.slug !== p.slug).slice(0, 3);
  const price = p.sizes[sizeIdx][1];
  const avail = availFor(p.sizes[sizeIdx][0]); // availability of the selected size
  const soldOut = (avail ?? 1) <= 0; // no stock entry (e.g. static mode) → buyable
  const low = avail != null && avail > 0 && avail <= LOW_STOCK;

  return (
    <SiteLayout active="catalog">
      <div className="wrap">
        <div className="pdp" style={{ "--accent": p.accent } as CSSProperties}>
          <div className="media">
            <div className="glow" />
            <img src={p.img} alt={p.name} />
          </div>
          <div>
            <div className="cls">{p.cls}</div>
            <h1 className="disp">{p.name}</h1>

            <p className="blurb">{p.blurb}</p>

            <div className="kicker" style={{ marginBottom: 8 }}>
              Select size
            </div>
            <div className="sizes">
              {p.sizes.map(([label, amt], i) => {
                const sSold = (availFor(label) ?? 1) <= 0;
                // Sold-out sizes stay selectable so a customer can pick one and
                // ask to be notified; the Add-to-cart button is what's disabled.
                return (
                  <button
                    key={label}
                    type="button"
                    className={`size${i === sizeIdx ? " sel" : ""}${sSold ? " soldout" : ""}`}
                    style={sSold ? { opacity: 0.55 } : undefined}
                    onClick={() => {
                      setSizeIdx(i);
                      setAdded(false);
                    }}
                  >
                    <div className="mg">{label}</div>
                    <div className="pr">{sSold ? "Sold out" : `$${amt}`}</div>
                  </button>
                );
              })}
            </div>

            <div className="qtyrow">
              <span className="kicker">Quantity</span>
              <div className="qtystep">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => {
                    setQty((q) => Math.max(1, q - 1));
                    setAdded(false);
                  }}
                >
                  −
                </button>
                <span>{qty}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => {
                    setQty((q) => Math.min(99, q + 1));
                    setAdded(false);
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {low && !soldOut ? (
              <p style={{ margin: "0 0 10px", color: "#e0902f", fontWeight: 600, fontSize: 13.5 }}>
                Only {avail} left in stock — order soon.
              </p>
            ) : null}

            <button
              type="button"
              className="btn"
              style={{ width: "100%", padding: 15, opacity: soldOut ? 0.55 : 1 }}
              disabled={soldOut}
              onClick={() => {
                if (soldOut) return;
                addLine({
                  slug: p.slug,
                  name: p.name,
                  size: p.sizes[sizeIdx][0],
                  unitCents: price * 100,
                  qty,
                });
                setAdded(true);
              }}
            >
              {soldOut ? (
                "Sold out"
              ) : added ? (
                "Added to cart ✓"
              ) : (
                <span className="cartline">
                  <span>Add to cart{qty > 1 ? ` · ${qty}` : ""}</span>
                  <span>${price * qty}</span>
                </span>
              )}
            </button>
            {added ? (
              <p style={{ marginTop: 10, textAlign: "center", fontSize: 13 }}>
                <Link to="/checkout" style={{ color: "var(--gold)" }}>
                  View cart &amp; check out →
                </Link>
              </p>
            ) : null}

            {soldOut ? (
              <NotifyForm key={p.sizes[sizeIdx][0]} slug={p.slug} size={p.sizes[sizeIdx][0]} />
            ) : null}

            <div className="meta">
              <div>
                <b>Certificate of Analysis</b> · published per lot (HPLC + mass
                spec)
              </div>
              <div>
                <b>Formula</b> {p.formula} &nbsp;·&nbsp; <b>MW</b> {p.mw}{" "}
                &nbsp;·&nbsp; <b>CAS</b> {p.cas}
              </div>
              <div>
                <b>Storage</b> room temp, lyophilized · <b>21+</b> · For research
                use only
              </div>
            </div>
          </div>
        </div>

        <div style={{ margin: "60px 0 20px" }}>
          <div className="kicker">More from the cast</div>
        </div>
        <div className="cards">
          {more.map((x) => (
            <ProductCard key={x.slug} p={x} />
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Back-in-stock signup for the currently-selected sold-out size. Remounts per
// size (keyed on the label) so switching sizes gives a fresh form.
function NotifyForm({ slug, size }: { slug: string; size: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  if (status === "done") {
    return (
      <p
        style={{
          margin: "12px 0 0",
          textAlign: "center",
          fontSize: 13.5,
          color: "var(--gold)",
          fontWeight: 600,
        }}
      >
        ✓ You're on the list — we'll email you the moment {size} is back.
      </p>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      <p style={{ margin: "0 0 8px", fontSize: 13.5, color: "var(--muted)" }}>
        Out of stock. Get an email the moment {size} is back:
      </p>
      <form
        style={{ display: "flex", gap: 8 }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!EMAIL_RE.test(email)) {
            setStatus("error");
            return;
          }
          setStatus("sending");
          try {
            const r = await requestBackInStock({ data: { slug, size, email } });
            setStatus(r.ok ? "done" : "error");
          } catch {
            setStatus("error");
          }
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="you@email.com"
          aria-label={`Email me when ${size} is back in stock`}
          style={{
            flex: 1,
            minWidth: 0,
            padding: "12px 13px",
            borderRadius: 8,
            border: "1px solid var(--line)",
            background: "var(--bg2)",
            color: "var(--cream)",
            fontSize: 14,
            fontFamily: "inherit",
          }}
        />
        <button
          type="submit"
          className="btn ghost"
          style={{ flex: "0 0 auto", padding: "12px 18px" }}
          disabled={status === "sending"}
        >
          {status === "sending" ? "…" : "Notify me"}
        </button>
      </form>
      {status === "error" ? (
        <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--crimson)" }}>
          Enter a valid email and try again.
        </p>
      ) : null}
    </div>
  );
}
