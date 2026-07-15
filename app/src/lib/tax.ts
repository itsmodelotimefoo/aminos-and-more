// Sales-tax estimate (client display + server-authoritative). This is a
// STATE-base-rate estimate keyed by US 2-letter code — not a full local
// (county/city) or nexus-aware calculation. For exact tax at scale, swap
// estimateTaxCents for a tax API (TaxJar / Stripe Tax). Non-US or unknown
// regions return 0. Tax is applied to the product subtotal only (not shipping).

// Approximate US STATE base sales-tax rates (%). Localities may add more.
const STATE_RATE: Record<string, number> = {
  AL: 4, AK: 0, AZ: 5.6, AR: 6.5, CA: 7.25, CO: 2.9, CT: 6.35, DE: 0,
  FL: 6, GA: 4, HI: 4, ID: 6, IL: 6.25, IN: 7, IA: 6, KS: 6.5, KY: 6,
  LA: 4.45, ME: 5.5, MD: 6, MA: 6.25, MI: 6, MN: 6.875, MS: 7, MO: 4.225,
  MT: 0, NE: 5.5, NV: 6.85, NH: 0, NJ: 6.625, NM: 4.875, NY: 4, NC: 4.75,
  ND: 5, OH: 5.75, OK: 4.5, OR: 0, PA: 6, RI: 7, SC: 6, SD: 4.2, TN: 7,
  TX: 6.25, UT: 6.1, VT: 6, VA: 5.3, WA: 6.5, WV: 6, WI: 5, WY: 4, DC: 6,
};

// Map common full state names → code, so a typed-out state still resolves.
const NAME_TO_CODE: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY", "district of columbia": "DC",
};

export function stateToCode(stateRaw: string): string | null {
  const s = (stateRaw || "").trim();
  if (!s) return null;
  if (s.length === 2 && STATE_RATE[s.toUpperCase()] !== undefined) return s.toUpperCase();
  const byName = NAME_TO_CODE[s.toLowerCase()];
  return byName ?? null;
}

export function taxRateFor(stateRaw: string, country = "US"): number {
  if ((country || "US").toUpperCase() !== "US") return 0;
  const code = stateToCode(stateRaw);
  return code ? (STATE_RATE[code] ?? 0) : 0;
}

// Estimated tax in cents on the taxable (subtotal) amount.
export function estimateTaxCents(
  taxableCents: number,
  stateRaw: string,
  country = "US",
): number {
  const rate = taxRateFor(stateRaw, country);
  return Math.round(taxableCents * (rate / 100));
}
