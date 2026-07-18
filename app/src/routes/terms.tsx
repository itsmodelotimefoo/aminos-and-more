import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "../components/site/Chrome";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Privacy — Aminos & More" },
      {
        name: "description",
        content:
          "Terms of sale and privacy policy for Aminos & More — research use only, buyer certification, payment, shipping, and data handling.",
      },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <SiteLayout>
      <div className="pagehead wrap">
        <div className="kicker">Legal</div>
        <h1 className="disp">Terms &amp; Privacy</h1>
      </div>
      <section style={{ paddingTop: 20 }}>
        <div className="wrap">
          <p className="updated">Last updated: 12 July 2026</p>
          <div className="draftbar">
            <b>Draft — pending legal review.</b> These terms are a working draft
            and have not yet been reviewed by qualified counsel. They do not yet
            constitute final, binding terms of sale.
          </div>
          <div className="prose legal">
            <h2>1. Research use only</h2>
            <p>
              All products sold by Aminos &amp; More ("we", "us", "the Company")
              are supplied strictly as chemicals <b>for laboratory and research
              use only (RUO)</b>. They are <b>not for human or veterinary
              consumption</b>, are not drugs, dietary supplements, cosmetics, or
              foods, and are not intended to diagnose, treat, cure, or prevent
              any disease. Nothing on this site is medical advice.
            </p>

            <h2>2. Buyer eligibility &amp; certification</h2>
            <p>
              By placing an order you represent, warrant, and certify that:
            </p>
            <ul>
              <li>You are at least <b>21 years of age</b>;</li>
              <li>
                You are a <b>qualified researcher</b> or an entity acquiring
                these materials for legitimate research purposes;
              </li>
              <li>
                You will handle, store, and dispose of the materials in
                accordance with all applicable laws and good laboratory
                practice;
              </li>
              <li>
                You will <b>not</b> administer the materials to yourself, any
                other human, or any animal, and will not resell or redistribute
                them for any such use.
              </li>
            </ul>
            <p>
              We reserve the right to refuse, cancel, or limit any order at our
              sole discretion.
            </p>

            <h2>3. No claims, no guidance</h2>
            <p>
              We describe products by identity and mechanism only (name, class,
              formula/CAS). We make no representation that any product is safe or
              effective for any use, and we do not and cannot provide dosing,
              protocol, or usage guidance. Any research application is undertaken
              solely by, and at the sole risk of, the purchaser.
            </p>

            <h2>4. Orders, pricing &amp; payment</h2>
            <p>
              Prices are listed in U.S. dollars and may change without notice.
              Payment is processed by a third-party cryptocurrency payment
              processor; by paying you also agree to that processor's terms. An
              order is not accepted until payment is confirmed. We are not
              responsible for network fees, exchange-rate movement, or transfers
              sent to an incorrect or expired address.
            </p>

            <h2>5. Shipping, title &amp; risk of loss</h2>
            <p>
              Shipping rates and timeframes are estimates. Title and risk of
              loss pass to the buyer upon our delivery of the parcel to the
              carrier. The buyer is the importer/recipient of record and is
              responsible for ensuring the materials may lawfully be received at
              the destination.
            </p>

            <h2>6. Returns &amp; refunds</h2>
            <p>
              Because these are research chemicals, returns are not accepted once
              a parcel has shipped, except where a shipment is materially not as
              described or arrives damaged and is reported to us within 7 days of
              delivery with supporting evidence. Approved remedies are limited to
              replacement or refund of the affected item at our discretion.
            </p>

            <h2>7. Disclaimer of warranties</h2>
            <p>
              Products are provided "as is" and "as available." To the fullest
              extent permitted by law, we disclaim all warranties, express or
              implied, including merchantability, fitness for a particular
              purpose, and non-infringement. Published Certificates of Analysis
              speak only to the identity and purity tests performed on the
              referenced lot.
            </p>

            <h2>8. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, our total liability arising
              out of or related to any product or these terms shall not exceed
              the amount you paid for the product at issue. We shall not be liable
              for any indirect, incidental, consequential, special, or punitive
              damages, or for any harm resulting from misuse of the materials.
            </p>

            <h2>9. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless the Company and its
              officers, employees, and suppliers from any claim, loss, or
              liability arising from your purchase, handling, or use of the
              materials, or your breach of these terms.
            </p>

            <h2>10. Governing law</h2>
            <p>
              These terms are governed by the laws of the State of [STATE], USA,
              without regard to conflict-of-law rules.{" "}
              <em>
                [Governing law, venue, and any dispute-resolution/arbitration
                terms to be set by counsel.]
              </em>
            </p>

            <h2>11. Changes</h2>
            <p>
              We may update these terms at any time. The version in effect at the
              time of your order governs that order.
            </p>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid var(--line)",
                margin: "44px 0",
              }}
            />

            <h2>Privacy Policy</h2>

            <h3>Information we collect</h3>
            <ul>
              <li>
                <b>Order &amp; contact details</b> you provide: email address and
                shipping address;
              </li>
              <li>
                <b>Order records:</b> items purchased, amounts, and status;
              </li>
              <li>
                <b>Age/eligibility acknowledgement</b>, stored locally in your
                browser;
              </li>
              <li>Basic technical/log data generated when you use the site.</li>
            </ul>
            <p>
              We do not knowingly collect payment card numbers — cryptocurrency
              payments are handled by our payment processor, not stored by us.
            </p>

            <h3>How we use it</h3>
            <p>
              To process and fulfil orders, arrange shipping, provide
              Certificates of Analysis and support, prevent fraud and misuse, and
              meet legal obligations. We do <b>not</b> sell your personal
              information.
            </p>

            <h3>Third parties</h3>
            <p>
              We share the minimum data necessary with service providers who help
              us operate: a cryptocurrency payment processor (to confirm payment)
              and a shipping/logistics provider (to rate and label shipments).
              Each processes data under its own terms.
            </p>

            <h3>Cookies &amp; local storage</h3>
            <p>
              We use your browser's local storage to remember your
              age/eligibility acknowledgement and cart. We do not use third-party
              advertising trackers.
            </p>

            <h3>Your choices</h3>
            <p>
              You may request access to, correction of, or deletion of your
              personal information by contacting us at{" "}
              <a href="mailto:privacy@aminosandmore.com">
                privacy@aminosandmore.com
              </a>
              . We will respond as required by applicable law.{" "}
              <em>
                [Specific CCPA/GDPR rights and response times to be confirmed by
                counsel based on where you operate and ship.]
              </em>
            </p>

            <h3>Security &amp; retention</h3>
            <p>
              We take reasonable measures to protect the data we hold and retain
              order records as needed for business and legal purposes. No method
              of transmission or storage is completely secure.
            </p>

            <p style={{ marginTop: 34 }}>
              <Link to="/contact" className="btn">
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
