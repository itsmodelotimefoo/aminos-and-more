import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "../components/site/Chrome";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join the Club — Aminos & More" },
      {
        name: "description",
        content:
          "New lots, fresh lab reports, members-only access. Confirm you are 21+ to join.",
      },
    ],
  }),
  component: Join,
});

function Join() {
  const [email, setEmail] = useState("");
  const [is21, setIs21] = useState(false);
  const [joined, setJoined] = useState(false);

  return (
    <SiteLayout active="join">
      <div className="pagehead wrap">
        <div className="kicker">Join the Club</div>
        <h1 className="disp">Be first to every drop.</h1>
      </div>
      <section className="join" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="box">
            <div className="kicker">Members only</div>
            <h2 className="disp">New lots. Fresh reports.</h2>
            <p>
              New lots, fresh lab reports, members-only access. No spam — just
              proof and product.
            </p>

            {joined ? (
              <p className="joined">
                YOU'RE ON THE LIST. WELCOME TO THE CLUB.
              </p>
            ) : (
              <form
                className="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (is21 && email) setJoined(true);
                }}
              >
                <input
                  type="email"
                  placeholder="you@email.com"
                  required
                  aria-label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" className="btn" disabled={!is21 || !email}>
                  Join
                </button>
              </form>
            )}

            {!joined ? (
              <label className="gate">
                <input
                  type="checkbox"
                  checked={is21}
                  onChange={(e) => setIs21(e.target.checked)}
                />
                <span>
                  I certify I am 21 years of age or older and a qualified
                  researcher. I understand all products are for research use only
                  — not for human or veterinary use.
                </span>
              </label>
            ) : null}

            <p style={{ fontSize: 12, marginTop: 16, color: "var(--muted)" }}>
              By joining you agree to our terms. This is a placeholder capture
              form for client review — no data is stored.
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
