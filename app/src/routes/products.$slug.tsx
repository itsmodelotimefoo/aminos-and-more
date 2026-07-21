import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type CSSProperties } from "react";
import { SiteLayout, ProductCard } from "../components/site/Chrome";
import { getProduct, LOW_STOCK } from "../lib/products";
import { loadCatalog, loadStock } from "../lib/api/catalog.functions";
import { addLine } from "../lib/cart";

export const Route = createFileRoute("/products/$slug")({
  loader: async () => ({ products: await loadCatalog(), stock: await loadStock() }),
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
  const { products, stock } = Route.useLoaderData();
  const p = products.find((x) => x.slug === slug);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

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
  const avail = stock[p.slug];
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
              {p.sizes.map(([label, amt], i) => (
                <button
                  key={label}
                  type="button"
                  className={`size${i === sizeIdx ? " sel" : ""}`}
                  onClick={() => {
                    setSizeIdx(i);
                    setAdded(false);
                  }}
                >
                  <div className="mg">{label}</div>
                  <div className="pr">${amt}</div>
                </button>
              ))}
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
