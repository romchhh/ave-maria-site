import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductClient from "@/components/product/ProductClient";
import JsonLd from "@/components/shared/JsonLd";
import PageShell from "@/components/shared/PageShell";
import { sitePath } from "@/lib/i18n/paths";
import { getSiteUrl } from "@/lib/i18n/seo";
import { stripMediaQuery } from "@/lib/mediaUrl";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  getAllProductIds,
  getProductById,
  getRelatedProducts,
} from "@/lib/products";
import { formatCardPrice } from "@/lib/format";
import { getMessages } from "@/lib/i18n/messages";
import {
  generateBreadcrumbStructuredData,
  generateProductStructuredData,
} from "@/lib/seo";
import { MEDIA } from "@/lib/media";
import { SITE_NAME } from "@/lib/siteContact";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const ids = await getAllProductIds();
    return ids.map((id) => ({ id }));
  } catch (error) {
    console.warn("[product generateStaticParams]", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Not found" };

  const description =
    product.description ||
    `${product.name} — ${formatCardPrice(product)}. ${SITE_NAME}.`;
  const imagePath = product.images[0]
    ? stripMediaQuery(product.images[0])
    : MEDIA.hero;

  return {
    ...buildPageMetadata({
      title: `${product.name} | ${SITE_NAME}`,
      description,
      path: `product/${id}`,
      image: imagePath,
    }),
    other: {
      "product:price:amount": Number(product.priceNum || 0).toFixed(2),
      "product:price:currency": "UAH",
      "product:availability": product.inStock ? "in stock" : "out of stock",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const related = await getRelatedProducts(id, 4);
  const t = getMessages();
  const baseUrl = getSiteUrl();

  return (
    <PageShell kind="product">
      <JsonLd data={generateProductStructuredData(product, baseUrl)} />
      <JsonLd
        data={generateBreadcrumbStructuredData(
          [
            { name: t.product.home, url: sitePath() },
            { name: t.product.catalog, url: sitePath("catalog") },
            { name: product.name, url: sitePath(`product/${id}`) },
          ],
          baseUrl
        )}
      />
      <ProductClient product={product} related={related} />
    </PageShell>
  );
}
