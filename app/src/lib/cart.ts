// Client-side cart, persisted in localStorage. SSR-safe: never touch
// localStorage/window at module load — only inside functions/effects.
import { useEffect, useState } from "react";
import type { CartLine } from "./checkout";

const KEY = "am_cart_v1";
const EVENT = "am-cart-change";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readCart(): CartLine[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

function writeCart(lines: CartLine[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function addLine(line: CartLine): void {
  const lines = readCart();
  const existing = lines.find((l) => l.slug === line.slug && l.size === line.size);
  if (existing) {
    existing.qty = Math.min(99, existing.qty + line.qty);
  } else {
    lines.push({ ...line, qty: Math.min(99, line.qty) });
  }
  writeCart(lines);
}

export function updateQty(slug: string, size: string, qty: number): void {
  let lines = readCart();
  if (qty <= 0) {
    lines = lines.filter((l) => !(l.slug === slug && l.size === size));
  } else {
    const l = lines.find((x) => x.slug === slug && x.size === size);
    if (l) l.qty = Math.min(99, qty);
  }
  writeCart(lines);
}

export function removeLine(slug: string, size: string): void {
  writeCart(readCart().filter((l) => !(l.slug === slug && l.size === size)));
}

export function clearCart(): void {
  writeCart([]);
}

// Reactive hook for cart contents. Empty during SSR + first paint, then
// hydrates from localStorage and follows changes (this tab + other tabs).
export function useCart(): { lines: CartLine[]; count: number } {
  const [lines, setLines] = useState<CartLine[]>([]);
  useEffect(() => {
    const sync = () => setLines(readCart());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  return { lines, count };
}
