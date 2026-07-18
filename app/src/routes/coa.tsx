import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "../components/site/Chrome";

export const Route = createFileRoute("/coa")({
  head: () => ({
    meta: [
      { title: "Certificates of Analysis — Aminos & More" },
      {
        name: "description",
        content:
          "Every lot is tested for identity and purity by an independent accredited lab, with the Certificate of Analysis published and tied to the lot number on your vial.",
      },
    ],
  }),
  component: Coa,
});

function Coa() {
  function onLookup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("lot") as HTMLInputElement | null;
    const lot = input?.value.trim();
    if (!lot) return;
    window.location.href =
      "mailto:coa@aminosandmore.com?subject=" +
      encodeURIComponent("CoA request — Lot " + lot) +
      "&body=" +
      encodeURIComponent(
        "Please send the Certificate of Analysis for lot " + lot + ".",
      );
  }

  return (
    <SiteLayout>
      <div className="pagehead wrap">
        <div className="kicker">Certificates of Analysis</div>
        <h1 className="disp">
          Read the report.
          <br />
          Check the lot.
        </h1>
      </div>
      <section style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="prose">
            <p>
              Every lot we release is tested for identity and purity by an
              independent, accredited lab, and the Certificate of Analysis is
              published and tied to the lot number printed on your vial. No
              inflated claims &mdash; just the report.
            </p>
          </div>

          <div className="lookup">
            <div className="lbl">Look up a lot</div>
            <form onSubmit={onLookup}>
              <input
                id="lot"
                name="lot"
                type="text"
                placeholder="Lot number from your vial (e.g. AM-XXXX)"
                aria-label="Lot number"
                required
              />
              <button className="btn" type="submit">
                Request CoA
              </button>
            </form>
            <small>
              Enter the lot number and we'll email you the exact Certificate of
              Analysis for that batch. The current lot's CoA is also linked on
              each product page.
            </small>
          </div>

          <div className="three">
            <div className="b">
              <div className="n">01</div>
              <h4>Find your lot</h4>
              <p>The lot number is printed on the vial label and shown on your order.</p>
            </div>
            <div className="b">
              <div className="n">02</div>
              <h4>Match the report</h4>
              <p>
                Each CoA lists only the tests that lot received &mdash; identity
                (mass spec) and purity (HPLC).
              </p>
            </div>
            <div className="b">
              <div className="n">03</div>
              <h4>Decide for yourself</h4>
              <p>That's the whole promise. Tested by lot, published by lot.</p>
            </div>
          </div>

          <div className="prose" style={{ marginTop: 44 }}>
            <h3>Can't find a lot?</h3>
            <p>
              Email{" "}
              <a
                href="mailto:coa@aminosandmore.com"
                style={{ color: "var(--gold)" }}
              >
                coa@aminosandmore.com
              </a>{" "}
              with your lot or order number and we'll send the report.
            </p>
            <p style={{ marginTop: 26 }}>
              <Link to="/catalog" className="btn">
                Browse tested lots
              </Link>
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
