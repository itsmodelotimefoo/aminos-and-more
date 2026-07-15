import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "../components/site/Chrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Aminos & More" },
      {
        name: "description",
        content:
          "Proof over promises. Every batch independently tested by an accredited lab, every result published and matched to the lot on your vial.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <SiteLayout active="about">
      <div className="pagehead wrap">
        <div className="kicker">About</div>
        <h1 className="disp">Proof over promises.</h1>
      </div>
      <section style={{ paddingTop: 20 }}>
        <div className="wrap prose">
          <p>
            The research-compound category runs on promises. We'd rather hand you
            the proof and get out of the way.
          </p>
          <p>
            Aminos &amp; More was built on one idea: every batch is independently
            tested by an accredited lab, and every result is published — identity
            and purity, matched to the exact lot on your vial. No inflated claims,
            no hidden panels, no fine print games.
          </p>
          <h3>The cast</h3>
          <p>
            Every compound gets a character drawn from what the molecule actually
            does — the copper that cross-links collagen, the peptide that lays new
            vessels, the coenzyme that shuttles the cell's energy. The art tells
            the mechanism; the label tells the truth.
          </p>
          <h3>Tested by lot</h3>
          <p>
            HPLC and mass spec on every lot, at an independent accredited lab,
            with the full Certificate of Analysis posted and tied to its lot
            number. That's the whole promise: read the report, check the lot,
            decide for yourself.
          </p>
          <p style={{ marginTop: 34 }}>
            <Link to="/catalog" className="btn">
              Explore the catalog
            </Link>
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
