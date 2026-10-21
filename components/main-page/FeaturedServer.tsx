import ProductRail from "@/components/main-page/ProductRail";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import {
  getNewProducts,
  getPopularProducts,
  getSaleProducts,
} from "@/lib/products";

export default async function FeaturedServer({ lang }: { lang: Locale }) {
  const t = getMessages(lang);
  const [popular, news, sale] = await Promise.all([
    getPopularProducts(12),
    getNewProducts(12),
    getSaleProducts(12),
  ]);

  return (
    <>
      <ProductRail
        id="home-popular-title"
        title={t.home.featured}
        products={popular}
        lang={lang}
        priorityCount={4}
      />
      <ProductRail
        id="home-new-title"
        title={t.home.newArrivals}
        products={news}
        lang={lang}
      />
      <ProductRail
        id="home-sale-title"
        title={t.home.sale}
        products={sale}
        lang={lang}
      />
    </>
  );
}
