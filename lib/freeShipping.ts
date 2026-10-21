import { FREE_SHIPPING_UAH } from "@/lib/productDetails";

export { FREE_SHIPPING_UAH };

export function freeShippingRemaining(cartTotal: number): number {
  const total = Math.max(0, Number(cartTotal) || 0);
  return Math.max(0, FREE_SHIPPING_UAH - total);
}

export function freeShippingProgress(cartTotal: number): number {
  const total = Math.max(0, Number(cartTotal) || 0);
  if (FREE_SHIPPING_UAH <= 0) return 100;
  return Math.min(100, Math.round((total / FREE_SHIPPING_UAH) * 100));
}

export function hasFreeShipping(cartTotal: number): boolean {
  return freeShippingRemaining(cartTotal) === 0 && cartTotal > 0;
}
