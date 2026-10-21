import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductClient from "@/components/product/ProductClient";
import JsonLd from "@/components/shared/JsonLd";
import PageShell from "@/components/shared/PageShell";
import {
  parseLangParam,
  pageAlternates,
  getSiteUrl,
  OG_LOCALE,
} from "@/lib/i18n/seo";
import {
  getAllProductIds,
  getProductById,
  getRelatedProducts,
} from "@/lib/products";
import { formatCardPrice } from "@/lib/format";
import { getMessages } from "@/lib/i18n/messages";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import {
  generateBreadcrumbStructuredData,
  generateProductStructuredData,
} from "@/lib/seo";
import { MEDIA } from "@/lib/media";
import { SITE_NAME } from "@/lib/siteContact";

export const revalidate = 300;

export async function generateStaticParams() {
  const ids = await getAllProductIds();
  return SUPPORTED_LOCALES.flatMap((lang) =>
    ids.map((id) => ({ lang, id }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}): Promise<Metadata> {
  const { lang: raw, id } = await params;
  const lang = parseLangParam(raw);
  const product = await getProductById(id);
  if (!product) return { title: "Not found" };

  const base = getSiteUrl();
  const description =
    product.description ||
    `${product.name} — ${formatCardPrice(product)}. ${SITE_NAME}.`;
  const imageUrl = product.images[0]
    ? product.images[0].startsWith("http")
      ? product.images[0]
      : `${base}${product.images[0]}`
    : `${base}${MEDIA.hero}`;

  return {
    title: product.name,
    description,
    alternates: pageAlternates(lang, `product/${id}`),
    openGraph: {
      title: `${product.name} | ${SITE_NAME}`,
      description,
      type: "website",
      url: `${base}/${lang}/product/${id}`,
      siteName: SITE_NAME,
      locale: OG_LOCALE[lang],
      images: [{ url: imageUrl, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${SITE_NAME}`,
      description,
      images: [imageUrl],
    },
    other: {
      "product:price:amount": Number(product.priceNum || 0).toFixed(2),
      "product:price:currency": "UAH",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang: raw, id } = await params;
  const lang = parseLangParam(raw);
  const product = await getProductById(id);
  if (!product) notFound();

  const related = await getRelatedProducts(id, 4);
  const t = getMessages(lang);
  const baseUrl = getSiteUrl();

  return (
    <PageShell kind="product">
      <JsonLd data={generateProductStructuredData(product, lang, baseUrl)} />
      <JsonLd
        data={generateBreadcrumbStructuredData(
          [
            { name: t.product.home, url: `/${lang}` },
            { name: t.product.catalog, url: `/${lang}/catalog` },
            { name: product.name, url: `/${lang}/product/${id}` },
          ],
          baseUrl
        )}
      />
      <ProductClient product={product} related={related} lang={lang} />
    </PageShell>
  );
}
