/** Extra PDP accordion fields packed into `model_params` JSON (backward-compatible). */

export type ProductDetailExtra = {
  characteristics?: string;
  notes?: string;
  activeIngredients?: string;
  usage?: string;
};

export function parseProductDetails(raw?: string | null): ProductDetailExtra {
  const text = (raw || "").trim();
  if (!text) return {};
  if (text.startsWith("{")) {
    try {
      const data = JSON.parse(text) as ProductDetailExtra;
      if (data && typeof data === "object") return data;
    } catch {
      /* fall through */
    }
  }
  return { characteristics: text, activeIngredients: text };
}

export function serializeProductDetails(extra: ProductDetailExtra): string {
  const payload: ProductDetailExtra = {
    ...(extra.characteristics?.trim()
      ? { characteristics: extra.characteristics.trim() }
      : {}),
    ...(extra.notes?.trim() ? { notes: extra.notes.trim() } : {}),
    ...(extra.activeIngredients?.trim()
      ? { activeIngredients: extra.activeIngredients.trim() }
      : {}),
    ...(extra.usage?.trim() ? { usage: extra.usage.trim() } : {}),
  };
  if (!Object.keys(payload).length) return "";
  // Keep plain text if only characteristics (legacy seed rows)
  if (
    payload.characteristics &&
    !payload.notes &&
    !payload.activeIngredients &&
    !payload.usage
  ) {
    return payload.characteristics;
  }
  return JSON.stringify(payload);
}

export const FREE_SHIPPING_UAH = 1500;
