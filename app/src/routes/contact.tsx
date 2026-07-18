import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "../components/site/Chrome";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Aminos & More" },
      {
        name: "description",
        content:
          "Contact Aminos & More about orders, Certificates of Analysis, shipping, or data requests.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <SiteLayout>
      <div className="pagehead wrap">
        <div className="kicker">Contact</div>
        <h1 className="disp">Talk to a human.</h1>
      </div>
      <section style={{ paddingTop: 20 }}>
        <div className="wrap prose">
          <p>
            Questions about an order, a Certificate of Analysis, or shipping?
            Email us — we read everything and typically reply within{" "}
            <b>1&ndash;2 business days</b>.
          </p>

          <div className="contact-grid">
            <div className="cbox">
              <div className="lbl">Orders &amp; support</div>
              <a href="mailto:support@aminosandmore.com">
                support@aminosandmore.com
              </a>
              <p>Include your order number so we can find you fast.</p>
            </div>
            <div className="cbox">
              <div className="lbl">Certificates of Analysis</div>
              <a href="mailto:coa@aminosandmore.com">coa@aminosandmore.com</a>
              <p>Have a lot number? We'll send the exact report.</p>
            </div>
            <div className="cbox">
              <div className="lbl">Privacy &amp; data requests</div>
              <a href="mailto:privacy@aminosandmore.com">
                privacy@aminosandmore.com
              </a>
              <p>Access, correction, or deletion of your data.</p>
            </div>
            <div className="cbox">
              <div className="lbl">Wholesale &amp; lab inquiries</div>
              <a href="mailto:hello@aminosandmore.com">
                hello@aminosandmore.com
              </a>
              <p>Bulk, institutional, or press.</p>
            </div>
          </div>

          <h3>Before you write</h3>
          <p>
            Our products are supplied for laboratory and research use only. We
            can help with orders, testing, and shipping &mdash; but we cannot
            advise on research design, handling protocols, or any human or
            veterinary use.
          </p>

          <div className="note">
            <b>Draft — pending review.</b> Contact addresses shown here are
            placeholders. Confirm each inbox is live and monitored before public
            launch.
          </div>

          <p style={{ marginTop: 30 }}>
            <Link to="/catalog" className="btn">
              Back to the catalog
            </Link>
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
