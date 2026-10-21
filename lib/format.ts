import type { Product } from "@/lib/types";

export function formatMoney(n: number): string {
  return n.toLocaleString("uk-UA") + " ₴";
}

export function formatCardPrice(p: Pick<Product, "priceNum" | "price">): string {
  if (typeof p.priceNum === "number") {
    return p.priceNum.toLocaleString("uk-UA") + " грн";
  }
  return String(p.price || "")
    .replace("₴", "грн")
    .trim();
}

/** Storefront price — UAH only. */
export function formatDualPrice(
  p: Pick<Product, "priceNum" | "price">
): string {
  return formatCardPrice(p);
}

export function formatSizes(p: Pick<Product, "sizeOptions" | "sizes">): string {
  if (p.sizeOptions?.length) return p.sizeOptions.join(" ");
  return String(p.sizes || "")
    .replace(/·/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
