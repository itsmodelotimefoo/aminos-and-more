import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout, ProductCard, PRODUCTS } from "../components/site/Chrome";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Catalog — Aminos & More" },
      {
        name: "description",
        content:
          "The full vault — every research compound, duo and blend, independently tested and published by lot.",
      },
    ],
  }),
  component: Catalog,
});

const FILTERS = [
  { k: "all", label: "All" },
  { k: "peptide", label: "Compounds" },
  { k: "duo", label: "Duos" },
  { k: "blend", label: "Blends" },
] as const;

function Catalog() {
  const [sel, setSel] = useState<string>("all");
  const shown = PRODUCTS.filter((p) => sel === "all" || p.kind === sel);
  return (
    <SiteLayout active="catalog">
      <div className="pagehead wrap">
        <div className="kicker">The Cast · Full Catalog</div>
        <h1 className="disp">Shop the vault.</h1>
        <p>Every SKU independently tested and published by lot.</p>
      </div>
      <section style={{ paddingTop: 30 }}>
        <div className="wrap">
          <div className="filters">
            {FILTERS.map((f) => (
              <button
                key={f.k}
                className={sel === f.k ? "sel" : ""}
                onClick={() => setSel(f.k)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="cards">
            {shown.map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
