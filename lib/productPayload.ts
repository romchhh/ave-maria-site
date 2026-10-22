import {
  parseProductDetails,
  serializeProductDetails,
} from "@/lib/productDetails";
import { stripMediaQuery } from "@/lib/mediaUrl";
import { formatPriceLabel } from "@/lib/sql";
import type { Product, ProductMedia } from "@/lib/types";

function numOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseMedia(body: Record<string, unknown>, images: string[]): ProductMedia[] {
  if (Array.isArray(body.media)) {
    return body.media
      .map((m) => {
        if (!m || typeof m !== "object") return null;
        const row = m as Record<string, unknown>;
        const url = stripMediaQuery(String(row.url || ""));
        if (!url) return null;
        return {
          url,
          type: row.type === "video" ? ("video" as const) : ("image" as const),
          ...(typeof row.width === "number" ? { width: row.width } : {}),
          ...(typeof row.height === "number" ? { height: row.height } : {}),
        };
      })
      .filter((m): m is ProductMedia => Boolean(m));
  }
  return images.map((url) => ({ url, type: "image" as const }));
}

/** Merge request body into a Product for create/update. */
export function productFromBody(
  body: Record<string, unknown>,
  base: Partial<Product> & { id: string }
): Product {
  const sizeOptions: string[] = Array.isArray(body.sizeOptions)
    ? body.sizeOptions.map(String).filter(Boolean)
    : base.sizeOptions || ["S", "M", "L"];
  const priceNum =
    numOrNull(body.priceNum) ?? base.priceNum ?? 0;
  const images: string[] = Array.isArray(body.images)
    ? body.images.map((u) => stripMediaQuery(String(u))).filter(Boolean)
    : base.images || [];
  const media = parseMedia(body, images);
  const imageUrls =
    media.filter((m) => m.type === "image").map((m) => m.url) || images;

  const lookProductIds = Array.isArray(body.lookProductIds)
    ? body.lookProductIds.map(String).filter(Boolean)
    : base.lookProductIds;

  const priceEur = numOrNull(body.priceEur);
  const compareAtPriceNum = numOrNull(body.compareAtPriceNum);

  return {
    id: base.id,
    name:
      body.name != null ? String(body.name).trim() : base.name || "",
    nameEn:
      body.nameEn != null
        ? String(body.nameEn)
        : base.nameEn || "",
    sizes: sizeOptions.join(" · "),
    sizeOptions,
    priceNum,
    price: formatPriceLabel(priceNum),
    priceEur: priceEur != null && priceEur > 0 ? priceEur : null,
    compareAtPriceNum:
      compareAtPriceNum != null && compareAtPriceNum > 0
        ? compareAtPriceNum
        : null,
    color: body.color != null ? String(body.color) : base.color || "",
    colorHex:
      body.colorHex != null ? String(body.colorHex) : base.colorHex || "",
    material:
      body.material != null ? String(body.material) : base.material || "",
    description:
      body.description != null
        ? String(body.description)
        : base.description || "",
    descriptionEn:
      body.descriptionEn != null
        ? String(body.descriptionEn)
        : base.descriptionEn || "",
    longDescription:
      body.longDescription != null
        ? String(body.longDescription)
        : base.longDescription || "",
    longDescriptionEn:
      body.longDescriptionEn != null
        ? String(body.longDescriptionEn)
        : base.longDescriptionEn || "",
    shortDescription:
      body.shortDescription != null
        ? String(body.shortDescription)
        : base.shortDescription,
    photoSize:
      body.photoSize != null ? String(body.photoSize) : base.photoSize || "",
    ...(() => {
      const baseDetails = parseProductDetails(
        base.modelParams || base.characteristics || ""
      );
      const details = {
        characteristics:
          body.characteristics != null
            ? String(body.characteristics)
            : base.characteristics || baseDetails.characteristics || "",
        notes:
          body.notes != null
            ? String(body.notes)
            : base.notes || baseDetails.notes || "",
        activeIngredients:
          body.activeIngredients != null
            ? String(body.activeIngredients)
            : base.activeIngredients ||
              baseDetails.activeIngredients ||
              "",
        usage:
          body.usage != null
            ? String(body.usage)
            : base.usage || baseDetails.usage || "",
      };
      const packed = serializeProductDetails(details);
      return {
        characteristics: details.characteristics,
        notes: details.notes,
        activeIngredients: details.activeIngredients,
        usage: details.usage,
        modelParams: packed,
      };
    })(),
    images: imageUrls,
    media,
    swatches: Array.isArray(body.swatches)
      ? body.swatches
      : base.swatches || [],
    inStock:
      body.inStock != null ? Boolean(body.inStock) : base.inStock !== false,
    isVisible:
      body.isVisible != null
        ? Boolean(body.isVisible)
        : base.isVisible !== false,
    sku:
      body.sku != null
        ? (body.sku as string | number)
        : (base.sku ?? base.id),
    category:
      body.category != null
        ? String(body.category) || undefined
        : base.category,
    isNew: body.isNew != null ? Boolean(body.isNew) : Boolean(base.isNew),
    isPopular:
      body.isPopular != null
        ? Boolean(body.isPopular)
        : Boolean(base.isPopular),
    isSale:
      body.isSale != null ? Boolean(body.isSale) : Boolean(base.isSale),
    lookProductIds,
    colorGroup: base.colorGroup ?? null,
  };
}
