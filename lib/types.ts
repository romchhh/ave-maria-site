import type { Locale } from "@/lib/i18n/config";

export interface ProductSwatch {
  img: string;
  label: string;
  hex?: string;
}

/** Sibling product in the same color family (13pm-style color switcher). */
export interface ProductColorVariant {
  id: string;
  name: string;
  color: string;
  image: string;
  hex?: string;
}

export type ProductMediaType = "image" | "video";

export interface ProductMedia {
  url: string;
  type: ProductMediaType;
  width?: number;
  height?: number;
}

export interface Product {
  id: string;
  /** Display name (UK) — kept for backward compat. */
  name: string;
  nameEn?: string;
  sizes: string;
  sizeOptions: string[];
  price: string;
  priceNum: number;
  /** Explicit EUR price; if omitted, derived from UAH. */
  priceEur?: number | null;
  /** Old/compare-at price in UAH (for sale strikethrough). */
  compareAtPriceNum?: number | null;
  color: string;
  colorHex?: string;
  /** Composition / formula (склад). */
  material: string;
  description: string;
  descriptionEn?: string;
  longDescription: string;
  longDescriptionEn?: string;
  shortDescription?: string;
  /** Product specs / active ingredients (multiline). */
  characteristics?: string;
  /** Fragrance / aroma notes accordion. */
  notes?: string;
  /** Active ingredients accordion (falls back to characteristics). */
  activeIngredients?: string;
  /** How to use accordion. */
  usage?: string;
  /** @deprecated clothing leftover */
  photoSize?: string;
  /** Raw DB field — may be plain text or JSON details blob */
  modelParams?: string;
  images: string[];
  media?: ProductMedia[];
  swatches: ProductSwatch[];
  inStock: boolean;
  sku: number | string;
  category?: string;
  /** Brand label (Hadat, ZOLA, ELEMIS…). */
  brand?: string;
  isNew?: boolean;
  isPopular?: boolean;
  isSale?: boolean;
  colorGroup?: string | null;
  colorVariants?: ProductColorVariant[];
  lookProductIds?: string[];
}

export function productName(p: Product, lang: Locale = "uk"): string {
  void lang;
  return p.name;
}

export function productDescription(p: Product, lang: Locale = "uk"): string {
  void lang;
  return p.longDescription || p.description || "";
}

export interface BasketItem {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  size: string;
  quantity: number;
  image: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  image: string;
}

export type DeliveryMethod =
  | "nova_poshta_branch"
  | "nova_poshta_locker"
  | "nova_poshta_courier"
  | "pickup"
  | "international";

export interface CheckoutPayload {
  customerName: string;
  phone: string;
  email?: string;
  deliveryMethod: DeliveryMethod;
  city: string;
  address: string;
  comment?: string;
  locale: string;
  items: Array<{
    productId: string;
    name: string;
    size: string;
    quantity: number;
    priceNum: number;
    image?: string;
  }>;
}
