import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "../components/site/Chrome";
import { useCart, updateQty, removeLine } from "../lib/cart";
import {
  subtotalCents,
  formatUsd,
  type Address,
  type RateOption,
} from "../lib/checkout";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Aminos & More" },
      { name: "description", content: "Cart and secure crypto checkout." },
    ],
  }),
  component: Checkout,
});

const EMPTY_ADDR: Address = {
  name: "",
  street1: "",
  street2: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  phone: "",
};

function Checkout() {
  const { lines } = useCart();
  const [cert21, setCert21] = useState(false);
  const [certRes, setCertRes] = useState(false);
  const [email, setEmail] = useState("");
  const [addr, setAddr] = useState<Address>(EMPTY_ADDR);
  const [rates, setRates] = useState<RateOption[] | null>(null);
  const [rateId, setRateId] = useState("");
  const [loadingRates, setLoadingRates] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const subtotal = subtotalCents(lines);
  const chosen = rates?.find((r) => r.rateId === rateId) ?? null;
  const total = subtotal + (chosen?.amountCents ?? 0);

  const addrComplete =
    addr.name && addr.street1 && addr.city && addr.state && addr.zip && addr.country;
  const gatePassed = cert21 && certRes;
  const canGetRates = Boolean(gatePassed && email && addrComplete && lines.length);

  function setField(k: keyof Address, v: string) {
    setAddr((a) => ({ ...a, [k]: v }));
    setRates(null); // address changed — force a fresh rate lookup
    setRateId("");
  }

  async function getRates() {
    setError("");
    setLoadingRates(true);
    setRates(null);
    setRateId("");
    try {
      const res = await fetch("/api/checkout/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr, items: lines }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not get shipping rates.");
      setRates(data.rates as RateOption[]);
      if (data.rates?.[0]) setRateId(data.rates[0].rateId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not get shipping rates.");
    } finally {
      setLoadingRates(false);
    }
  }

  async function pay() {
    if (!chosen) return;
    setError("");
    setPlacing(true);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          address: addr,
          items: lines,
          shippoRateId: chosen.rateId,
          shippingCents: chosen.amountCents,
          carrier: chosen.carrier,
          service: chosen.service,
          certified21: cert21,
          certifiedResearcher: certRes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.invoiceUrl) {
        throw new Error(data.error || "Could not start payment.");
      }
      window.location.href = data.invoiceUrl as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start payment.");
      setPlacing(false);
    }
  }

  return (
    <SiteLayout>
      <div className="pagehead wrap">
        <div className="kicker">Checkout</div>
        <h1 className="disp">Your cart.</h1>
      </div>

      <section style={{ paddingTop: 20 }}>
        <div className="wrap">
          {lines.length === 0 ? (
            <div className="co-empty">
              <p>Your cart is empty.</p>
              <Link to="/catalog" className="btn" style={{ marginTop: 16 }}>
                Browse the catalog
              </Link>
            </div>
          ) : (
            <div className="co-grid">
              {/* LEFT: cart + forms */}
              <div>
                <div className="co-lines">
                  {lines.map((l) => (
                    <div className="co-line" key={l.slug + l.size}>
                      <div>
                        <div className="co-name">{l.name}</div>
                        <div className="co-sub">
                          {l.size} · {formatUsd(l.unitCents)} each
                        </div>
                      </div>
                      <div className="co-qtywrap">
                        <button
                          type="button"
                          aria-label="Decrease"
                          onClick={() => updateQty(l.slug, l.size, l.qty - 1)}
                        >
                          −
                        </button>
                        <span>{l.qty}</span>
                        <button
                          type="button"
                          aria-label="Increase"
                          onClick={() => updateQty(l.slug, l.size, l.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <div className="co-lineprice">{formatUsd(l.unitCents * l.qty)}</div>
                      <button
                        type="button"
                        className="co-remove"
                        aria-label="Remove"
                        onClick={() => removeLine(l.slug, l.size)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <h3 className="co-h">Researcher certification</h3>
                <label className="gate">
                  <input
                    type="checkbox"
                    checked={cert21}
                    onChange={(e) => setCert21(e.target.checked)}
                  />
                  <span>I certify I am 21 years of age or older.</span>
                </label>
                <label className="gate">
                  <input
                    type="checkbox"
                    checked={certRes}
                    onChange={(e) => setCertRes(e.target.checked)}
                  />
                  <span>
                    I am a qualified researcher and understand these products are for research
                    use only — not for human or veterinary use.
                  </span>
                </label>

                <h3 className="co-h">Shipping</h3>
                <div className="co-form">
                  <input
                    className="co-in wide"
                    placeholder="Full name"
                    value={addr.name}
                    onChange={(e) => setField("name", e.target.value)}
                  />
                  <input
                    className="co-in wide"
                    placeholder="Street address"
                    value={addr.street1}
                    onChange={(e) => setField("street1", e.target.value)}
                  />
                  <input
                    className="co-in wide"
                    placeholder="Apt, suite (optional)"
                    value={addr.street2}
                    onChange={(e) => setField("street2", e.target.value)}
                  />
                  <input
                    className="co-in"
                    placeholder="City"
                    value={addr.city}
                    onChange={(e) => setField("city", e.target.value)}
                  />
                  <input
                    className="co-in"
                    placeholder="State / province"
                    value={addr.state}
                    onChange={(e) => setField("state", e.target.value)}
                  />
                  <input
                    className="co-in"
                    placeholder="ZIP / postal code"
                    value={addr.zip}
                    onChange={(e) => setField("zip", e.target.value)}
                  />
                  <input
                    className="co-in"
                    placeholder="Country (ISO-2, e.g. US)"
                    maxLength={2}
                    value={addr.country}
                    onChange={(e) => setField("country", e.target.value.toUpperCase())}
                  />
                  <input
                    className="co-in wide"
                    type="email"
                    placeholder="Email (for order + tracking)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    className="co-in wide"
                    placeholder="Phone (optional)"
                    value={addr.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="btn ghost"
                  style={{ marginTop: 16 }}
                  disabled={!canGetRates || loadingRates}
                  onClick={getRates}
                >
                  {loadingRates ? "Getting rates…" : "Get shipping rates"}
                </button>
                {!gatePassed ? (
                  <p className="co-hint">Confirm both certifications to continue.</p>
                ) : null}

                {rates && rates.length > 0 ? (
                  <div className="co-rates">
                    <h3 className="co-h">Choose shipping</h3>
                    {rates.map((r) => (
                      <label className={`co-rate${rateId === r.rateId ? " sel" : ""}`} key={r.rateId}>
                        <input
                          type="radio"
                          name="rate"
                          checked={rateId === r.rateId}
                          onChange={() => setRateId(r.rateId)}
                        />
                        <span className="co-rate-name">
                          {r.carrier} · {r.service}
                          {r.estDays ? ` · ~${r.estDays} day${r.estDays > 1 ? "s" : ""}` : ""}
                        </span>
                        <span className="co-rate-price">{formatUsd(r.amountCents)}</span>
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* RIGHT: summary */}
              <aside className="co-summary">
                <h3 className="co-h" style={{ marginTop: 0 }}>
                  Order summary
                </h3>
                <div className="co-row">
                  <span>Subtotal</span>
                  <span>{formatUsd(subtotal)}</span>
                </div>
                <div className="co-row">
                  <span>Shipping</span>
                  <span>{chosen ? formatUsd(chosen.amountCents) : "—"}</span>
                </div>
                <div className="co-row total">
                  <span>Total</span>
                  <span>{formatUsd(total)}</span>
                </div>

                <button
                  type="button"
                  className="btn"
                  style={{ width: "100%", padding: 15, marginTop: 8 }}
                  disabled={!chosen || placing}
                  onClick={pay}
                >
                  {placing ? "Starting payment…" : "Pay with crypto"}
                </button>
                <p className="co-pay">
                  Pay in BTC, USDT (TRC-20) or ETH via NOWPayments. BTC confirms on-chain in
                  ~10–30 min. You'll be redirected to a secure invoice.
                </p>
                {error ? <p className="co-error">{error}</p> : null}
                <p className="co-ruo">
                  Research use only · not for human or veterinary use · 21+.
                </p>
              </aside>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
