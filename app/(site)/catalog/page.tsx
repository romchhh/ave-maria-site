import type { Metadata } from "next";
import CatalogServer from "@/components/catalog/CatalogServer";
import JsonLd from "@/components/shared/JsonLd";
import PageShell from "@/components/shared/PageShell";
import { siteSeo } from "@/lib/i18n/seo";
import { getProductsByCategory } from "@/lib/products";
import { generateItemListStructuredData, generateWebPageStructuredData } from "@/lib/seo";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: siteSeo.catalogTitle,
    description: siteSeo.catalogDescription,
    path: "catalog",
  });
}

export default async function CatalogPage() {
  const products = await getProductsByCategory("all");

  return (
    <PageShell kind="catalog">
      <JsonLd data={generateItemListStructuredData(products)} />
      <JsonLd
        data={generateWebPageStructuredData({
          name: siteSeo.catalogTitle,
          description: siteSeo.catalogDescription,
          path: "catalog",
        })}
      />
      <CatalogServer />
    </PageShell>
  );
}
