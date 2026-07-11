import { Link } from "@tanstack/react-router";
import type { ReactNode, CSSProperties } from "react";
import { PRODUCTS, fromPrice, type Product } from "../../lib/products";
import { useCart } from "../../lib/cart";

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

export function ProductCard({ p }: { p: Product }) {
  return (
    <Link
      to="/products/$slug"
      params={{ slug: p.slug }}
      className="card"
      style={{ "--accent": p.accent } as CSSProperties}
    >
      <div className="imgwrap">
        {p.tag ? <span className="tag">{p.tag}</span> : null}
        {p.counselGated ? <span className="tag flag">Pending review</span> : null}
        <div className="glow" />
        <img loading="lazy" decoding="async" src={p.img} alt={p.name} />
      </div>
      <div className="body">
        <div className="cls">{p.cls}</div>
        <div className="r">
          <h3>{p.name}</h3>
          <span className="price">{fromPrice(p)}</span>
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
      <Nav active={active} />
      {children}
      <Footer />
    </div>
  );
}

export { PRODUCTS };
