import ProductRail from "@/components/main-page/ProductRail";
import { getMessages } from "@/lib/i18n/messages";
import {
  getNewProducts,
  getPopularProducts,
  getSaleProducts,
} from "@/lib/products";

export default async function FeaturedServer() {
  const t = getMessages();
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
        priorityCount={4}
      />
      <ProductRail
        id="home-new-title"
        title={t.home.newArrivals}
        products={news}
      />
      <ProductRail id="home-sale-title" title={t.home.sale} products={sale} />
    </>
  );
}
