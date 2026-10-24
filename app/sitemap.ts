import type { MetadataRoute } from "next";
import { getLegalSlugs } from "@/lib/content/legal";
import { siteUrl } from "@/lib/i18n/paths";
import { getSiteUrl } from "@/lib/i18n/seo";
import { stripMediaQuery } from "@/lib/mediaUrl";
import { getVisibleProducts } from "@/lib/products";

export const revalidate = 3600;

function languageAlternates(path: string) {
  const base = getSiteUrl();
  const url = siteUrl(base, path);
  return {
    uk: url,
    "x-default": url,
  };
}

function absoluteImage(base: string, src: string | undefined): string | null {
  if (!src) return null;
  const clean = stripMediaQuery(src);
  if (clean.startsWith("http")) return clean;
  return `${base}${clean.startsWith("/") ? clean : `/${clean}`}`;
}

function entry(
  path: string,
  opts: {
    lastModified?: Date;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
    images?: string[];
  }
): MetadataRoute.Sitemap[number] {
  const base = getSiteUrl();
  return {
    url: siteUrl(base, path),
    lastModified: opts.lastModified || new Date(),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: {
      languages: languageAlternates(path),
    },
    ...(opts.images?.length ? { images: opts.images } : {}),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  let products: Awaited<ReturnType<typeof getVisibleProducts>> = [];
  try {
    products = await getVisibleProducts();
  } catch (error) {
    console.warn("[sitemap] products unavailable", error);
  }
  const legalSlugs = getLegalSlugs();
  const now = new Date();

  const staticPaths: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "", changeFrequency: "daily", priority: 1 },
    { path: "catalog", changeFrequency: "daily", priority: 0.9 },
    { path: "about", changeFrequency: "monthly", priority: 0.7 },
    { path: "contacts", changeFrequency: "monthly", priority: 0.7 },
    ...legalSlugs.map((slug) => ({
      path: slug,
      changeFrequency: "monthly" as const,
      priority: slug === "shipping-payment" ? 0.5 : 0.35,
    })),
  ];

  const staticEntries = staticPaths.map((p) =>
    entry(p.path, {
      lastModified: now,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })
  );

  const productEntries = products.map((p) => {
    const img = absoluteImage(base, p.images?.[0]);
    return entry(`product/${p.id}`, {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
      images: img ? [img] : undefined,
    });
  });

  return [...staticEntries, ...productEntries];
}
