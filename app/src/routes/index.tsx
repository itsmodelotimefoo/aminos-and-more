import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, Marquee, ProductCard } from "../components/site/Chrome";
import { loadCatalog } from "../lib/api/catalog.functions";

export const Route = createFileRoute("/")({
  loader: async () => ({ products: await loadCatalog() }),
  component: Index,
});

function Index() {
  const { products } = Route.useLoaderData();
  const featured = products.slice(0, 6);
  return (
    <SiteLayout>
      <header className="hero">
        <div className="wrap grid">
          <div>
            <div className="kicker">Independent lab-tested · Published by lot</div>
            <h1 className="disp">
              Tested by lot.
              <br />
              <span className="amp">&amp;</span> built
              <br />
              for trust.
            </h1>
            <p className="lede">
              Premium research compounds with the receipts to match. Every batch
              verified by an independent accredited lab — every result published,
              matched to the lot on your vial.
            </p>
            <div className="cta">
              <Link to="/catalog" className="btn">
                Explore the catalog
              </Link>
              <Link to="/testing" className="btn ghost">
                See the testing
              </Link>
            </div>
            <div className="stats">
              <div>
                <b className="gold-text">≥98%</b>
                <span>Purity standard</span>
              </div>
              <div>
                <b className="gold-text">100%</b>
                <span>Batches published</span>
              </div>
              <div>
                <b className="gold-text">1:1</b>
                <span>CoA per lot</span>
              </div>
            </div>
          </div>
          <div className="heroimg">
            <img src="/products/ghk-cu.png" alt="Aminos & More GHK-Cu hero vial" />
          </div>
        </div>
      </header>

      <Marquee />

      <section>
        <div className="wrap">
          <div className="head">
            <div className="kicker">The Cast</div>
            <h2 className="disp">
              Every compound,
              <br />
              its own character.
            </h2>
            <p>
              Drawn from what the molecule actually does. The art tells the
              mechanism; the label tells the truth.
            </p>
          </div>
          <div className="cards">
            {featured.map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
          <p className="center" style={{ marginTop: 34 }}>
            <Link to="/catalog" className="btn">
              See the full catalog →
            </Link>
          </p>
        </div>
      </section>

      <section
        style={{
          background: "var(--bg2)",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="wrap">
          <div className="head">
            <div className="kicker">How it works</div>
            <h2 className="disp">Bench to bench.</h2>
          </div>
          <div className="steps">
            <div className="step">
              <div className="n">01</div>
              <h4>Source</h4>
              <p>Vetted suppliers, held to a ≥98% purity standard.</p>
            </div>
            <div className="step">
              <div className="n">02</div>
              <h4>Test</h4>
              <p>Every lot to an independent accredited lab — HPLC + mass spec.</p>
            </div>
            <div className="step">
              <div className="n">03</div>
              <h4>Publish</h4>
              <p>The full CoA posted and tied to the lot number.</p>
            </div>
            <div className="step">
              <div className="n">04</div>
              <h4>Ship</h4>
              <p>Lyophilized, room-temp stable, discreetly packaged.</p>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
