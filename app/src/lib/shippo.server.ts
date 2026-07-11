// Server-only Shippo integration (live rates + label purchase) via the REST API.
// Products ship lyophilized, room-temp, no cold chain — standard small parcel,
// plain unbranded packaging. Auth token is the SHIPPO_API_TOKEN Worker secret.
import { env } from "cloudflare:workers";
import type { Address, CartLine, RateOption } from "./checkout";

const SHIPPO_BASE = "https://api.goshippo.com";

function token(): string {
  const t = (env as Record<string, string | undefined>).SHIPPO_API_TOKEN;
  if (!t) throw new Error("SHIPPO_API_TOKEN is not configured.");
  return t;
}

// Ship-from origin. EDIT THESE to the real warehouse address before going live
// (or move to a Worker secret). Shippo needs a complete, valid US address to
// return live rates.
const SHIP_FROM = {
  name: "Aminos & More Fulfillment",
  street1: "1 Research Way",
  city: "Austin",
  state: "TX",
  zip: "78701",
  country: "US",
  phone: "0000000000",
  email: "orders@aminos-and-more.example",
};

// One small parcel covers the vial SKUs (lyophilized, light). Tune as needed.
const PARCEL = {
  length: "6",
  width: "4",
  height: "2",
  distance_unit: "in",
  weight: "8",
  mass_unit: "oz",
};

async function shippoFetch(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${SHIPPO_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${token()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Shippo ${path} failed (${res.status}): ${JSON.stringify(json).slice(0, 300)}`);
  }
  return json;
}

export async function getRates(address: Address, _items: CartLine[]): Promise<RateOption[]> {
  const shipment = await shippoFetch("/shipments/", {
    address_from: SHIP_FROM,
    address_to: {
      name: address.name,
      street1: address.street1,
      street2: address.street2 || undefined,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      phone: address.phone || undefined,
    },
    parcels: [PARCEL],
    async: false,
  });

  const rates: any[] = Array.isArray(shipment.rates) ? shipment.rates : [];
  return rates
    .map((r): RateOption => ({
      rateId: String(r.object_id),
      carrier: String(r.provider ?? "Carrier"),
      service: String(r.servicelevel?.name ?? r.servicelevel?.token ?? "Standard"),
      amountCents: Math.round(parseFloat(r.amount ?? "0") * 100),
      estDays: typeof r.estimated_days === "number" ? r.estimated_days : null,
    }))
    .filter((r) => r.amountCents > 0)
    .sort((a, b) => a.amountCents - b.amountCents);
}

export async function buyLabel(rateId: string): Promise<{
  tracking: string;
  labelUrl: string;
  carrier: string;
}> {
  const tx = await shippoFetch("/transactions/", {
    rate: rateId,
    label_file_type: "PDF",
    async: false,
  });
  if (tx.status && tx.status !== "SUCCESS") {
    throw new Error(`Shippo label not purchased (status ${tx.status}).`);
  }
  return {
    tracking: String(tx.tracking_number ?? ""),
    labelUrl: String(tx.label_url ?? ""),
    carrier: String(tx.rate?.provider ?? ""),
  };
}
