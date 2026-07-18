import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "../components/site/Chrome";

export const Route = createFileRoute("/testing")({
  head: () => ({
    meta: [
      { title: "Testing — Aminos & More" },
      {
        name: "description",
        content:
          "The testing moat: HPLC + mass spec on every lot at an independent accredited lab, with the full Certificate of Analysis published and tied to the lot number.",
      },
    ],
  }),
  component: Testing,
});

function Testing() {
  return (
    <SiteLayout active="testing">
      <div className="pagehead wrap">
        <div className="kicker">The Testing Moat</div>
        <h1 className="disp">
          Every lot. Every time.
          <br />
          Published.
        </h1>
      </div>
      <section style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="tg">
            <div>
              <div className="kicker">Proof over promises</div>
              <h2 className="disp">
                We don't ask you
                <br />
                to trust a label.
              </h2>
              <p>
                Each batch is verified for identity and purity by an independent,
                accredited lab, and the full Certificate of Analysis is posted —
                matched to the exact lot number printed on your vial. Scan the
                vial, read the report, decide for yourself.
              </p>
              <p style={{ marginTop: 20 }}>
                <Link to="/catalog" className="btn">
                  Shop tested lots
                </Link>
              </p>
            </div>
            <div className="chromo">
              <div className="lbl">HPLC — ILLUSTRATIVE TRACE · NOT AN ACTUAL RESULT</div>
              <svg viewBox="0 0 340 130" preserveAspectRatio="none">
                <line x1="0" y1="120" x2="340" y2="120" stroke="#33333d" strokeWidth="1" />
                <polyline
                  points="0,118 60,117 110,116 158,42 166,12 174,42 220,114 270,116 340,117"
                  fill="none"
                  stroke="#C9A24B"
                  strokeWidth="2.5"
                />
                <polyline
                  points="0,118 60,117 110,116 158,42 166,12 174,42 220,114 270,116 340,117 340,120 0,120"
                  fill="rgba(201,162,75,.10)"
                  stroke="none"
                />
                <circle cx="166" cy="12" r="3" fill="#E4C877" />
              </svg>
              <div className="row">
                <span>Identity: Confirmed</span>
                <span>Mass: Match</span>
                <span>Purity: ≥98%</span>
              </div>
            </div>
          </div>

          <div className="three">
            <div className="b">
              <h4>Identity — Mass Spec</h4>
              <p>Confirms the compound in the vial is exactly what the label says.</p>
            </div>
            <div className="b">
              <h4>Purity — HPLC</h4>
              <p>Measures how much of the vial is the compound. Release target: ≥98% — each lot's actual result is published on its CoA.</p>
            </div>
            <div className="b">
              <h4>Published — by lot</h4>
              <p>Each CoA lists only the tests that lot received, tied to its lot number.</p>
            </div>
          </div>

          <div style={{ marginTop: 40 }} className="flagnote">
            <b>Per-lot CoA viewer coming online.</b> Certificates will be served
            at <code>/coa/&lt;LOT&gt;</code>, matched to the lot number on each
            vial. Sample report shown above for layout review.
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
