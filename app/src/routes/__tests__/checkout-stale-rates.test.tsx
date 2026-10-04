// Regression tests: a shipping-rates response that resolves after the address
// or cart changed must never become selectable or usable for payment.
// Runs under `bun test` with happy-dom; network is fully mocked.
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { ReactNode } from "react";
import type { Root } from "react-dom/client";

// Register the DOM *before* react-dom loads (static imports are hoisted, so
// react-dom would otherwise decide at load time that no DOM exists).
GlobalRegistrator.register();
const { act } = await import("react");
const { createRoot } = await import("react-dom/client");

// Stub router + site chrome: the component under test only needs a plain tree.
mock.module("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: { component: () => ReactNode }) => opts,
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));
mock.module("../../components/site/Chrome", () => ({
  SiteLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const { Route } = await import("../checkout");
const { addLine, updateQty, clearCart } = await import("../../lib/cart");
const Checkout = (Route as unknown as { component: () => ReactNode }).component;

type Deferred = { resolve: (rates: unknown[]) => void; body: string };
const pending: Deferred[] = [];
const realFetch = globalThis.fetch;

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const rate = (id: string, amountCents: number) => ({
  rateId: id,
  carrier: "USPS",
  service: id,
  amountCents,
  estDays: 2,
});

let root: Root;
let host: HTMLElement;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  pending.length = 0;
  globalThis.fetch = ((_url: string, init?: RequestInit) =>
    new Promise<Response>((resolve) => {
      pending.push({
        body: String(init?.body),
        resolve: (rates) => resolve(jsonResponse({ rates })),
      });
    })) as typeof fetch;
  clearCart();
  addLine({ slug: "bpc-157", name: "BPC-157", size: "5 mg", unitCents: 4900, qty: 1 });
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  globalThis.fetch = realFetch;
});

const q = <T extends Element>(sel: string) => host.querySelector(sel) as T;
const byPlaceholder = (p: string) => q<HTMLInputElement>(`input[placeholder^="${p}"]`);
const buttonByText = (t: string) =>
  Array.from(host.querySelectorAll("button")).find((b) => b.textContent?.includes(t))!;
const rateInputs = () => Array.from(host.querySelectorAll<HTMLInputElement>('input[name="rate"]'));
const payButton = () => buttonByText("Pay with crypto");

async function setInput(el: HTMLInputElement, value: string) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function click(el: HTMLElement) {
  await act(async () => el.click());
}

async function fillValidForm() {
  await act(async () => root.render(<Checkout />));
  for (const cb of Array.from(host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))) {
    await click(cb);
  }
  await setInput(byPlaceholder("Full name"), "Test Researcher");
  await setInput(byPlaceholder("Street address"), "1 Lab Way");
  await setInput(byPlaceholder("City"), "Austin");
  await setInput(byPlaceholder("State"), "TX");
  await setInput(byPlaceholder("ZIP"), "78701");
  await setInput(byPlaceholder("Email"), "t@example.com");
}

async function resolvePending(i: number, rates: unknown[]) {
  await act(async () => {
    pending[i].resolve(rates);
    await Promise.resolve();
  });
}

describe("checkout: stale shipping-rate responses", () => {
  test("fresh rates (no change in between) are accepted — baseline", async () => {
    await fillValidForm();
    await click(buttonByText("Get shipping rates"));
    expect(pending.length).toBe(1);
    await resolvePending(0, [rate("r-fresh", 800)]);
    expect(rateInputs().map((r) => r.checked)).toEqual([true]);
    expect(payButton().disabled).toBe(false);
    expect(host.textContent).toContain("$8.00");
  });

  test("address changes while rates are in flight → old rates are dropped", async () => {
    await fillValidForm();
    await click(buttonByText("Get shipping rates"));
    await setInput(byPlaceholder("ZIP"), "78702"); // change address mid-flight
    await resolvePending(0, [rate("r-old", 800)]);
    expect(rateInputs()).toHaveLength(0);
    expect(payButton().disabled).toBe(true);
    expect(host.textContent).not.toContain("$8.00");
    expect(buttonByText("Get shipping rates").disabled).toBe(false); // can retry
  });

  test("cart changes while rates are in flight → old rates are dropped", async () => {
    await fillValidForm();
    await click(buttonByText("Get shipping rates"));
    await act(async () => updateQty("bpc-157", "5 mg", 2)); // change cart mid-flight
    await resolvePending(0, [rate("r-old", 800)]);
    expect(rateInputs()).toHaveLength(0);
    expect(payButton().disabled).toBe(true);
  });

  test("address changed away then back → the original request is still stale", async () => {
    await fillValidForm();
    await click(buttonByText("Get shipping rates"));
    await setInput(byPlaceholder("ZIP"), "78702");
    await setInput(byPlaceholder("ZIP"), "78701"); // back to the original value
    await resolvePending(0, [rate("r-old", 800)]);
    expect(rateInputs()).toHaveLength(0);
    expect(payButton().disabled).toBe(true);
  });

  test("stale response, then re-request → only the fresh rates are used for payment", async () => {
    await fillValidForm();
    await click(buttonByText("Get shipping rates"));
    await setInput(byPlaceholder("ZIP"), "78702");
    // The button stays disabled while the first request is in flight (existing
    // behavior), so a second request can only start after the stale one lands.
    expect(buttonByText("Getting rates").disabled).toBe(true);
    await resolvePending(0, [rate("r-old", 800)]);
    expect(rateInputs()).toHaveLength(0);
    expect(buttonByText("Get shipping rates").disabled).toBe(false);

    await click(buttonByText("Get shipping rates"));
    expect(pending.length).toBe(2);
    expect(pending[0].body).toContain('"zip":"78701"');
    expect(pending[1].body).toContain('"zip":"78702"');
    await resolvePending(1, [rate("r-new", 1200)]);
    expect(rateInputs().map((r) => r.checked)).toEqual([true]);
    expect(host.textContent).toContain("$12.00");
    expect(host.textContent).not.toContain("$8.00");

    // Paying sends the fresh rate, never the stale one.
    pending.length = 0;
    await click(payButton());
    expect(pending.length).toBe(1);
    expect(pending[0].body).toContain('"shippoRateId":"r-new"');
    expect(pending[0].body).toContain('"shippingCents":1200');
    expect(pending[0].body).not.toContain("r-old");
  });

  test("repeated change + re-request cycles → only the newest request's rates survive", async () => {
    // Truly overlapping requests are not reachable through the UI today (the
    // button is disabled while a request is in flight); this covers the
    // closest reachable sequence: several superseded responses in a row.
    await fillValidForm();
    await click(buttonByText("Get shipping rates"));
    await setInput(byPlaceholder("ZIP"), "78702");
    await resolvePending(0, [rate("r-old-1", 500)]); // stale, dropped
    await click(buttonByText("Get shipping rates"));
    await setInput(byPlaceholder("ZIP"), "78703");
    await resolvePending(1, [rate("r-old-2", 800)]); // stale, dropped
    await click(buttonByText("Get shipping rates"));
    expect(pending.length).toBe(3);
    await resolvePending(2, [rate("r-new", 1200)]);
    expect(rateInputs()).toHaveLength(1);
    expect(host.textContent).toContain("$12.00");
    expect(host.textContent).not.toContain("$5.00");
    expect(host.textContent).not.toContain("$8.00");
    expect(payButton().disabled).toBe(false);
  });
});
