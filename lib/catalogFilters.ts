import type { Product } from "@/lib/types";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

export function productMatchesCategoryFilter(
  product: Product,
  categoryId: string
): boolean {
  if (categoryId === "new") return Boolean(product.isNew);
  if (categoryId === "sale") {
    return (
      Boolean(product.isSale) ||
      (product.compareAtPriceNum != null &&
        product.compareAtPriceNum > product.priceNum)
    );
  }
  return product.category === categoryId;
}

export function productMatchesCategoryFilters(
  product: Product,
  categoryIds: string[]
): boolean {
  if (categoryIds.length === 0) return true;
  return categoryIds.some((id) => productMatchesCategoryFilter(product, id));
}

export function collectSizes(products: Product[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    for (const s of p.sizeOptions || []) {
      if (s) set.add(s);
    }
  }
  return [...set].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a);
    const ib = SIZE_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export function collectColors(products: Product[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    const color = (p.color || "").trim();
    if (!color || color.toLowerCase() === "logic clothes") continue;
    set.add(color);
    for (const sw of p.swatches || []) {
      const label = (sw.label || "").trim();
      if (label && label.toLowerCase() !== "основний" && label.toLowerCase() !== "main") {
        set.add(label);
      }
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, "uk"));
}

export function priceBounds(products: Product[]): { min: number; max: number } {
  if (!products.length) return { min: 0, max: 0 };
  let min = Infinity;
  let max = 0;
  for (const p of products) {
    const n = Number(p.priceNum) || 0;
    if (n < min) min = n;
    if (n > max) max = n;
  }
  return { min: Number.isFinite(min) ? min : 0, max };
}

function isCleanBrandLabel(brand: string): boolean {
  if (!brand || brand.length > 40) return false;
  if (/[\n\r]|\\n|Категорія|activeIngredients|Артикул:/i.test(brand)) {
    return false;
  }
  return true;
}

export function collectBrands(products: Product[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    const brand = (p.brand || "").trim();
    if (isCleanBrandLabel(brand)) set.add(brand);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "uk", { sensitivity: "base" }));
}
