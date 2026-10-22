import type { Product, ProductMedia } from "@/lib/types";

/** Усі медіа товару в порядку відображення (фото + відео). */
export function productGalleryMedia(product: Product): ProductMedia[] {
  if (product.media?.length) return product.media;
  return (product.images || []).map((url) => ({
    url,
    type: "image" as const,
  }));
}
