import type { Metadata } from "next";
import { siteUrl } from "@/lib/i18n/paths";
import { getSiteUrl } from "@/lib/i18n/seo";
import { MEDIA } from "@/lib/media";
import { SITE_NAME } from "@/lib/siteContact";

export function absoluteAssetUrl(path: string, base = getSiteUrl()): string {
  const raw = path.trim();
  if (!raw) return `${base}${MEDIA.hero}`;
  if (raw.startsWith("http")) return raw.split("?")[0] ?? raw;
  const clean = raw.split("?")[0] ?? raw;
  return `${base}${clean.startsWith("/") ? clean : `/${clean}`}`;
}

/** Єдиний шаблон meta / OG / Twitter для сторінок вітрини. */
export function buildPageMetadata(opts: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
  image?: string;
}): Metadata {
  const base = getSiteUrl();
  const canonical = siteUrl(base, opts.path ?? "");
  const imageUrl = absoluteAssetUrl(opts.image ?? MEDIA.hero, base);
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "uk_UA",
      url: canonical,
      siteName: SITE_NAME,
      title: opts.title,
      description: opts.description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: opts.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [imageUrl],
    },
    robots: opts.noIndex
      ? { index: false, follow: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}
