import { sitePath, siteUrl } from "@/lib/i18n/paths";
import { getSiteUrl, siteSeo } from "@/lib/i18n/seo";
import { stripMediaQuery } from "@/lib/mediaUrl";
import { MEDIA } from "@/lib/media";
import {
  SITE_ADDRESS_LINES,
  SITE_EMAIL,
  SITE_INSTAGRAM,
  SITE_INSTAGRAM_HANDLE,
  SITE_MAP_COORDS,
  SITE_NAME,
  SITE_PHONE,
  SITE_STUDIO_NAME,
} from "@/lib/siteContact";
import type { Product } from "@/lib/types";

const ORG_ID = (base: string) => `${base}/#organization`;
const WEBSITE_ID = (base: string) => `${base}/#website`;
const STORE_ID = (base: string) => `${base}/#store`;

export function generateOrganizationStructuredData(baseUrl = getSiteUrl()) {
  const handle = SITE_INSTAGRAM_HANDLE.replace("@", "");
  return {
    "@type": "Organization",
    "@id": ORG_ID(baseUrl),
    name: SITE_NAME,
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}${MEDIA.logo}`,
    },
    image: `${baseUrl}${MEDIA.logo}`,
    description: siteSeo.homeDescription,
    inLanguage: "uk-UA",
    email: SITE_EMAIL,
    telephone: SITE_PHONE,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_ADDRESS_LINES[0],
      addressLocality: "Київ",
      addressCountry: "UA",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE_PHONE,
      email: SITE_EMAIL,
      contactType: "customer service",
      availableLanguage: ["Ukrainian"],
      areaServed: "UA",
    },
    sameAs: [
      SITE_INSTAGRAM,
      `https://www.instagram.com/${handle}/`,
    ],
  };
}

export function generateWebsiteStructuredData(baseUrl = getSiteUrl()) {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID(baseUrl),
    name: SITE_NAME,
    url: baseUrl,
    inLanguage: "uk-UA",
    publisher: { "@id": ORG_ID(baseUrl) },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}${sitePath("catalog")}?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateLocalBusinessStructuredData(baseUrl = getSiteUrl()) {
  return {
    "@type": ["Store", "HealthAndBeautyBusiness"],
    "@id": STORE_ID(baseUrl),
    name: SITE_STUDIO_NAME,
    description: `${SITE_NAME} — студія та шоурум у Києві.`,
    url: siteUrl(baseUrl, "contacts"),
    image: `${baseUrl}${MEDIA.hero}`,
    telephone: SITE_PHONE,
    email: SITE_EMAIL,
    priceRange: "₴₴",
    currenciesAccepted: "UAH",
    paymentAccepted: "Cash, Credit Card, Bank Transfer",
    parentOrganization: { "@id": ORG_ID(baseUrl) },
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_ADDRESS_LINES[0],
      addressLocality: "Київ",
      addressCountry: "UA",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: SITE_MAP_COORDS.lat,
      longitude: SITE_MAP_COORDS.lng,
    },
    sameAs: [SITE_INSTAGRAM],
  };
}

/** Глобальний @graph для layout (Organization + WebSite + Store). */
export function buildSiteJsonLdGraph(baseUrl = getSiteUrl()) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      generateOrganizationStructuredData(baseUrl),
      generateWebsiteStructuredData(baseUrl),
      generateLocalBusinessStructuredData(baseUrl),
    ],
  };
}

export function generateWebPageStructuredData(opts: {
  name: string;
  description: string;
  path?: string;
  baseUrl?: string;
}) {
  const base = opts.baseUrl ?? getSiteUrl();
  const url = siteUrl(base, opts.path ?? "");
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: opts.name,
    description: opts.description,
    inLanguage: "uk-UA",
    isPartOf: { "@id": WEBSITE_ID(base) },
    about: { "@id": ORG_ID(base) },
  };
}

export function generateItemListStructuredData(
  products: Product[],
  baseUrl = getSiteUrl(),
  max = 48
) {
  const slice = products.slice(0, max);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Каталог Ave Maria Beauty Lab",
    numberOfItems: slice.length,
    itemListElement: slice.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${baseUrl}${sitePath(`product/${product.id}`)}`,
      name: product.name,
    })),
  };
}

export function generateProductStructuredData(
  product: Product,
  baseUrl = getSiteUrl()
) {
  const images = (product.images || []).map((src) => {
    const clean = stripMediaQuery(src);
    return clean.startsWith("http") ? clean : `${baseUrl}${clean}`;
  });
  const priceValidUntil = new Date();
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1);
  const brandName = product.brand?.trim() || SITE_NAME;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.shortDescription ||
      product.description ||
      `${product.name} — ${SITE_NAME}`,
    image: images.length ? images : [`${baseUrl}${MEDIA.hero}`],
    sku: String(product.sku || product.id),
    mpn: String(product.sku || product.id),
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    category: product.category || "Косметика",
    offers: {
      "@type": "Offer",
      url: `${baseUrl}${sitePath(`product/${product.id}`)}`,
      priceCurrency: "UAH",
      price: Number(product.priceNum || 0).toFixed(2),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORG_ID(baseUrl) },
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
