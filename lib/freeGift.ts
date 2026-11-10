import { FREE_GIFT_UAH } from "@/lib/productDetails";

export { FREE_GIFT_UAH };

export function freeGiftRemaining(cartTotal: number): number {
  const total = Math.max(0, Number(cartTotal) || 0);
  return Math.max(0, FREE_GIFT_UAH - total);
}

export function freeGiftProgress(cartTotal: number): number {
  const total = Math.max(0, Number(cartTotal) || 0);
  if (FREE_GIFT_UAH <= 0) return 100;
  return Math.min(100, Math.round((total / FREE_GIFT_UAH) * 100));
}

export function hasFreeGift(cartTotal: number): boolean {
  return freeGiftRemaining(cartTotal) === 0 && cartTotal > 0;
}
