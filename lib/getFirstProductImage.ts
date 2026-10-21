import { MEDIA } from "@/lib/media";

/** Ave Maria Beauty Lab products store image paths directly on `images[]`. */
export function getProductImageSrc(
  images: string[] | string | null | undefined,
  fallback = MEDIA.logo
): string {
  if (!images) return fallback;
  if (typeof images === "string") return images || fallback;
  return images[0] || fallback;
}
