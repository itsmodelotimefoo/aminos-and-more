import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type CSSProperties } from "react";
import { SiteLayout, ProductCard } from "../components/site/Chrome";
import { PRODUCTS, getProduct } from "../lib/products";

export const Route = createFileRoute("/products/$slug")({
  head: ({ params }) => {
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
  const p = getProduct(slug);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [added, setAdded] = useState(false);

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

  const more = PRODUCTS.filter((x) => x.slug !== p.slug).slice(0, 3);
  const price = p.sizes[sizeIdx][1];

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

            {p.counselGated ? (
              <div className="flagnote">
                <b>Pending legal review.</b> This SKU is presented by mechanism
                nomenclature only and is gated for marketing until qualified
                FDA/FTC counsel signs off.
              </div>
            ) : null}

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

            <button
              type="button"
              className="btn"
              style={{ width: "100%", padding: 15 }}
              onClick={() => setAdded(true)}
            >
              {added ? (
                "Added — cart is a demo"
              ) : (
                <span className="cartline">
                  <span>Add to cart</span>
                  <span>${price}</span>
                </span>
              )}
            </button>

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
