import CatalogClient from "@/components/catalog/CatalogClient";
import {
  collectBrands,
  collectColors,
  collectSizes,
  priceBounds,
} from "@/lib/catalogFilters";
import { getCategories, type CategoryId } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/config";
import { getProductsByCategory } from "@/lib/products";

export default async function CatalogServer({
  lang,
  category,
}: {
  lang: Locale;
  category?: string | null;
}) {
  const categories = await getCategories();
  const active: CategoryId =
    category && categories.some((c) => c.id === category) ? category : "all";
  const products = await getProductsByCategory(active);
  const sizes = collectSizes(products);
  const colors = collectColors(products);
  const brands = collectBrands(products);
  const bounds = priceBounds(products);

  return (
    <CatalogClient
      key={active}
      products={products}
      category={active}
      categories={categories}
      sizes={sizes}
      colors={colors}
      brands={brands}
      priceHint={bounds}
      lang={lang}
    />
  );
}
