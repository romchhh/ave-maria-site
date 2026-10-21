import { unstable_cache } from "next/cache";
import { readProducts } from "@/lib/adminStore";
import type { Product, ProductColorVariant } from "@/lib/types";

function enrichColorVariants(products: Product[]): Product[] {
  const byGroup = new Map<string, Product[]>();
  for (const p of products) {
    if (!p.colorGroup) continue;
    const list = byGroup.get(p.colorGroup) ?? [];
    list.push(p);
    byGroup.set(p.colorGroup, list);
  }

  return products.map((p) => {
    if (!p.colorGroup) return p;
    const siblings = byGroup.get(p.colorGroup) ?? [];
    if (siblings.length < 2) return { ...p, colorVariants: undefined };

    const colorVariants: ProductColorVariant[] = siblings.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color || s.name,
      image: s.images[0] || "",
      ...(s.swatches[0]?.hex ? { hex: s.swatches[0].hex } : {}),
    }));

    return { ...p, colorVariants };
  });
}

/** Server product cache — 5 min, matches ISR + public API. */
export const getProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const products = await readProducts();
    return enrichColorVariants(products);
  },
  ["ave-maria-products"],
  { revalidate: 300, tags: ["products"] }
);

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.id === id) ?? null;
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return getPopularProducts(limit);
}

function isOnSale(p: Product): boolean {
  return Boolean(
    p.isSale ||
      (p.compareAtPriceNum != null && p.compareAtPriceNum > p.priceNum)
  );
}

export async function getPopularProducts(limit = 12): Promise<Product[]> {
  const products = await getProducts();
  const flagged = products.filter((p) => p.isPopular);
  return (flagged.length ? flagged : products).slice(0, limit);
}

export async function getNewProducts(limit = 12): Promise<Product[]> {
  const products = await getProducts();
  const flagged = products.filter((p) => p.isNew);
  return (flagged.length ? flagged : products).slice(0, limit);
}

export async function getSaleProducts(limit = 12): Promise<Product[]> {
  const products = await getProducts();
  return products.filter(isOnSale).slice(0, limit);
}

/** Curated look first; otherwise catalog neighbors. */
export async function getRelatedProducts(
  id: string,
  limit = 4
): Promise<Product[]> {
  const products = await getProducts();
  const current = products.find((p) => p.id === id);
  if (current?.lookProductIds?.length) {
    const map = new Map(products.map((p) => [p.id, p]));
    return current.lookProductIds
      .map((rid) => map.get(rid))
      .filter((p): p is Product => !!p && p.id !== id)
      .slice(0, limit);
  }
  const others = products.filter((p) => p.id !== id);
  const sameCat = current?.category
    ? others.filter((p) => p.category === current.category)
    : [];
  const pool = sameCat.length ? sameCat : others;
  return pool.slice(0, limit);
}

export async function getAllProductIds(): Promise<string[]> {
  const products = await getProducts();
  return products.map((p) => p.id);
}

export async function getProductsByCategory(
  category?: string | null
): Promise<Product[]> {
  const products = await getProducts();
  if (!category || category === "all") return products;
  if (category === "new") return products.filter((p) => p.isNew);
  if (category === "sale") {
    return products.filter(
      (p) =>
        p.isSale ||
        (p.compareAtPriceNum != null && p.compareAtPriceNum > p.priceNum)
    );
  }
  return products.filter((p) => p.category === category);
}
