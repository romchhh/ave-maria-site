import { Suspense } from "react";
import CatalogClient from "@/components/catalog/CatalogClient";
import {
  collectBrands,
  collectColors,
  collectSizes,
  priceBounds,
} from "@/lib/catalogFilters";
import { getCategories } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/config";
import { getProductsByCategory } from "@/lib/products";

export default async function CatalogServer({ lang }: { lang: Locale }) {
  const categories = await getCategories();
  const products = await getProductsByCategory("all");
  const sizes = collectSizes(products);
  const colors = collectColors(products);
  const brands = collectBrands(products);
  const bounds = priceBounds(products);

  return (
    <Suspense
      fallback={
        <div className="cat-shell px-[var(--page-gutter)] py-12 text-sm text-gray-500">
          Завантаження каталогу…
        </div>
      }
    >
      <CatalogClient
        products={products}
        categories={categories}
        sizes={sizes}
        colors={colors}
        brands={brands}
        priceHint={bounds}
        lang={lang}
      />
    </Suspense>
  );
}
