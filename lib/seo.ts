import type { Locale } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/i18n/seo";
import { MEDIA } from "@/lib/media";
import {
  SITE_EMAIL,
  SITE_INSTAGRAM_HANDLE,
  SITE_NAME,
} from "@/lib/siteContact";
import type { Product } from "@/lib/types";

export function generateOrganizationStructuredData(baseUrl = getSiteUrl()) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: baseUrl,
    logo: `${baseUrl}${MEDIA.logo}`,
    description:
      "Ave Maria Beauty Lab — мультибрендовий магазин косметики. Твоя щоденна розкіш.",
    inLanguage: ["uk"],
    contactPoint: {
      "@type": "ContactPoint",
      email: SITE_EMAIL,
      contactType: "customer service",
      availableLanguage: ["Ukrainian"],
    },
    sameAs: [`https://www.instagram.com/${SITE_INSTAGRAM_HANDLE.replace("@", "")}/`],
  };
}

export function generateWebsiteStructuredData(baseUrl = getSiteUrl()) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: baseUrl,
    inLanguage: ["uk"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/uk/catalog?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateProductStructuredData(
  product: Product,
  lang: Locale,
  baseUrl = getSiteUrl()
) {
  const images = (product.images || []).map((src) =>
    src.startsWith("http") ? src : `${baseUrl}${src}`
  );
  const priceValidUntil = new Date();
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.shortDescription ||
      product.description ||
      `${product.name} — ${SITE_NAME}`,
    image: images.length ? images : [`${baseUrl}${MEDIA.hero}`],
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    sku: String(product.sku || product.id),
    category: product.category || "Косметика",
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/${lang}/product/${product.id}`,
      priceCurrency: "UAH",
      price: Number(product.priceNum || 0).toFixed(2),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceValidUntil: priceValidUntil.toISOString().split("T")[0],
    },
  };
}

export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>,
  baseUrl = getSiteUrl()
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}
