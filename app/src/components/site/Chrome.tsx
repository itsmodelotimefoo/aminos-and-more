import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode, type CSSProperties } from "react";
import { PRODUCTS, fromPrice, type Product } from "../../lib/products";
import { useCart } from "../../lib/cart";

const AGE_KEY = "am_age_ok";

// Site-wide 21+ / research-use entry gate. Rendered visible on the server and
// on first client paint (so unverified visitors never see content ungated),
// then dismissed on mount if the visitor already acknowledged. SSR-safe:
// initial state matches the server render; localStorage is only read in effect.
export function AgeGate() {
  const [open, setOpen] = useState(true);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(AGE_KEY) === "1") setOpen(false);
    } catch {
      /* localStorage unavailable — keep the gate up */
    }
  }, []);

  if (!open) return null;

  function enter() {
    try {
      window.localStorage.setItem(AGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  return (
    <div className="am-gate" role="dialog" aria-modal="true" aria-label="Age verification">
      <div className="am-gate-card">
        <div className="brand">
          AMINOS<span>&amp;</span>MORE
        </div>
        <div className="agebadge">21+ · Research use only</div>
        {declined ? (
          <>
            <h2 className="disp">Access restricted.</h2>
            <p>
              You must be 21 or older to enter. These materials are for laboratory and research
              use only — not for human or veterinary use.
            </p>
            <div className="am-gate-actions">
              <button type="button" className="btn ghost" onClick={() => setDeclined(false)}>
                Go back
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="disp">Before you enter.</h2>
            <p>
              The products on this site are research compounds for laboratory use only —{" "}
              <b>not for human or veterinary use</b>. By entering you confirm you are{" "}
              <b>21 or older</b> and a qualified researcher accessing this material for research
              purposes.
            </p>
            <div className="am-gate-actions">
              <button type="button" className="btn" onClick={enter}>
                I am 21+ · Enter
              </button>
              <button type="button" className="btn ghost" onClick={() => setDeclined(true)}>
                Leave
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

type NavKey = "catalog" | "testing" | "about" | "join" | null;

export function Nav({ active }: { active?: NavKey }) {
  const { count } = useCart();
  return (
    <nav>
      <div className="wrap row">
        <Link to="/" className="brand">
          AMINOS<span>&amp;</span>MORE
        </Link>
        <div className="links">
          <Link to="/catalog" className={active === "catalog" ? "active" : ""}>
            Catalog
          </Link>
          <Link to="/testing" className={active === "testing" ? "active" : ""}>
            Testing
          </Link>
          <Link to="/about" className={active === "about" ? "active" : ""}>
            About
          </Link>
          <Link to="/join" className={active === "join" ? "active" : ""}>
            Join
          </Link>
        </div>
        <Link to="/checkout" className="btn">
          Cart{count > 0 ? ` · ${count}` : ""}
        </Link>
      </div>
    </nav>
  );
}

export function Marquee() {
  const items = [
    ["HPLC + MASS SPEC", true],
    ["PUBLISHED BY LOT", false],
    ["ROOM-TEMP STABLE", false],
    ["TESTED BY LOT", true],
    ["INDEPENDENT LABS", false],
  ] as const;
  const loop = [...items, ...items];
  return (
    <div className="marq">
      <div className="track">
        {loop.map(([label, bold], i) => (
          <span key={i}>
            {bold ? <b>{label}</b> : label}
            {" ·"}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ProductCard({ p, soldOut }: { p: Product; soldOut?: boolean }) {
  return (
    <Link
      to="/products/$slug"
      params={{ slug: p.slug }}
      className="card"
      style={{ "--accent": p.accent, ...(soldOut ? { opacity: 0.62 } : {}) } as CSSProperties}
    >
      <div className="imgwrap">
        {soldOut ? (
          <span className="tag" style={{ color: "var(--muted)" }}>
            Sold out
          </span>
        ) : p.tag ? (
          <span className="tag">{p.tag}</span>
        ) : null}
        <div className="glow" />
        <img loading="lazy" decoding="async" src={p.img} alt={p.name} />
      </div>
      <div className="body">
        <div className="cls">{p.cls}</div>
        <div className="r">
          <h3>{p.name}</h3>
          <span className="price">{soldOut ? "Sold out" : fromPrice(p)}</span>
        </div>
        <div className="coa">CoA published by lot</div>
      </div>
    </Link>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="cols">
          <div>
            <div className="brand">
              AMINOS<span>&amp;</span>MORE
            </div>
            <p style={{ marginTop: 12, maxWidth: "36ch" }}>
              Premium research compounds. Independently tested. Published by lot.
            </p>
          </div>
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>
              Explore
            </div>
            <Link to="/catalog">Catalog</Link>
            <Link to="/testing">Testing</Link>
            <Link to="/about">About</Link>
            <Link to="/join">Join</Link>
          </div>
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>
              Company
            </div>
            <Link to="/testing">Certificates of Analysis</Link>
            <Link to="/join">Contact</Link>
            <Link to="/about">Terms &amp; Privacy</Link>
          </div>
        </div>
        <div className="disc">
          <span className="agebadge">21+ ONLY</span>
          <br />
          <b>For research and laboratory use only.</b> Products are not intended
          to diagnose, treat, cure, or prevent any disease, and are not for
          human or veterinary consumption. Not a dietary supplement or drug. All
          purchasers must certify they are qualified and 21 years of age or
          older. © 2026 Aminos &amp; More.
          <br />
          <br />
          <em>
            Placeholder marketing site for client review. Product imagery is
            AI-generated concept art. Copy and product classification pending
            qualified FDA/FTC legal review before public launch.
          </em>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout({
  active,
  children,
}: {
  active?: NavKey;
  children: ReactNode;
}) {
  return (
    <div className="am">
      <div className="am-bg" aria-hidden="true" />
      <AgeGate />
      <Nav active={active} />
      {children}
      <Footer />
    </div>
  );
}

export { PRODUCTS };
