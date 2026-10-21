import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import SiteHtmlShell from "@/components/SiteHtmlShell";
import { isSupportedLocale } from "@/lib/i18n/config";
import {
  generateLocaleStaticParams,
  getSiteUrl,
  pageAlternates,
  parseLangParam,
  seoCopy,
  OG_LOCALE,
} from "@/lib/i18n/seo";
import { MEDIA } from "@/lib/media";
import "../globals.css";

export const generateStaticParams = generateLocaleStaticParams;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang = parseLangParam(raw);
  const copy = seoCopy[lang];
  const baseUrl = getSiteUrl();

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: copy.siteTitle,
      template: "%s | Ave Maria Beauty Lab",
    },
    description: copy.homeDescription,
    keywords: copy.homeKeywords,
    authors: [{ name: "Ave Maria Beauty Lab" }],
    creator: "Ave Maria Beauty Lab",
    publisher: "Ave Maria Beauty Lab",
    icons: {
      icon: [{ url: MEDIA.logo, type: "image/png" }],
      apple: [{ url: MEDIA.logo }],
    },
    manifest: "/site.webmanifest",
    openGraph: {
      type: "website",
      locale: OG_LOCALE[lang],
      url: `${baseUrl}/${lang}`,
      siteName: "Ave Maria Beauty Lab",
      title: copy.siteTitle,
      description: copy.homeDescription,
      images: [
        {
          url: `${baseUrl}${MEDIA.hero}`,
          width: 1200,
          height: 630,
          alt: "Ave Maria Beauty Lab",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.siteTitle,
      description: copy.homeDescription,
      images: [`${baseUrl}${MEDIA.hero}`],
    },
    alternates: pageAlternates(lang),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  return <SiteHtmlShell lang={lang}>{children}</SiteHtmlShell>;
}
