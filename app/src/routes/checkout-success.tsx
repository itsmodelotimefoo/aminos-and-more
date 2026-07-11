import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "../components/site/Chrome";
import { clearCart } from "../lib/cart";
import { formatUsd } from "../lib/checkout";
import { getOrderStatus } from "../lib/api/orders.functions";

export const Route = createFileRoute("/checkout-success")({
  validateSearch: (s: Record<string, unknown>): { order?: string } => ({
    order: typeof s.order === "string" ? s.order : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Order received — Aminos & More" },
      { name: "description", content: "Payment received. Order status and tracking." },
    ],
  }),
  component: Success,
});

type StatusResult = Awaited<ReturnType<typeof getOrderStatus>>;
type FoundOrder = Extract<StatusResult, { found: true }>;

function Success() {
  const { order } = useSearch({ from: "/checkout-success" });
  const [result, setResult] = useState<StatusResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Payment received on this device — clear the local cart.
    clearCart();
    if (!order) {
      setLoaded(true);
      return;
    }
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await getOrderStatus({ data: { id: order } });
        if (cancelled) return;
        setResult(res);
        setLoaded(true);
        const stillPending = res.found && (res.status === "pending" || res.status === "paid");
        if (stillPending && tries < 20) {
          tries += 1;
          timer = setTimeout(poll, 6000);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    };
    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [order]);

  const o: FoundOrder | null = result && result.found ? result : null;

  return (
    <SiteLayout>
      <div className="pagehead wrap">
        <div className="kicker">Order received</div>
        <h1 className="disp">Thank you.</h1>
      </div>
      <section style={{ paddingTop: 20 }}>
        <div className="wrap" style={{ maxWidth: 680 }}>
          {!order ? (
            <p className="co-note">
              No order reference found. If you just paid, your confirmation email will have the
              details.
            </p>
          ) : !loaded ? (
            <p className="co-note">Checking your order…</p>
          ) : !o ? (
            <p className="co-note">
              We couldn't find order <b>{order}</b> yet. If you completed payment, it may take a
              moment to register — refresh shortly.
            </p>
          ) : (
            <div className="co-summary" style={{ position: "static" }}>
              <div className="co-row">
                <span>Order</span>
                <span>{o.id}</span>
              </div>
              <div className="co-row">
                <span>Status</span>
                <span className={`co-badge co-${o.status}`}>
                  {o.status === "pending" && "Payment confirming on-chain (~10–30 min)"}
                  {o.status === "paid" && "Paid — preparing your shipment"}
                  {o.status === "fulfilled" && "Paid & shipped"}
                  {o.status === "failed" && "Payment failed"}
                  {o.status === "expired" && "Invoice expired"}
                </span>
              </div>
              {o.payCurrency ? (
                <div className="co-row">
                  <span>Paid in</span>
                  <span>{String(o.payCurrency).toUpperCase()}</span>
                </div>
              ) : null}
              <div className="co-row">
                <span>Subtotal</span>
                <span>{formatUsd(o.subtotalCents)}</span>
              </div>
              <div className="co-row">
                <span>Shipping</span>
                <span>{formatUsd(o.shippingCents)}</span>
              </div>
              <div className="co-row total">
                <span>Total</span>
                <span>{formatUsd(o.totalCents)}</span>
              </div>
              {o.tracking ? (
                <div className="co-row">
                  <span>Tracking</span>
                  <span>
                    {o.carrier ? o.carrier + " · " : ""}
                    {o.tracking}
                  </span>
                </div>
              ) : null}
              <p className="co-note" style={{ marginTop: 18 }}>
                A confirmation with these details is on its way to your email. Products ship
                lyophilized, room-temp, in plain unbranded packaging.
              </p>
            </div>
          )}

          <p style={{ marginTop: 26 }}>
            <Link to="/catalog" className="btn">
              Continue browsing
            </Link>
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
