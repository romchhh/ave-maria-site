import type { Metadata, Viewport } from "next";
import SiteHtmlShell from "@/components/SiteHtmlShell";
import { siteUrl } from "@/lib/i18n/paths";
import { getSiteUrl, pageAlternates, siteSeo } from "@/lib/i18n/seo";
import { MEDIA } from "@/lib/media";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getSiteUrl();

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: siteSeo.siteTitle,
      template: "%s | Ave Maria Beauty Lab",
    },
    description: siteSeo.homeDescription,
    keywords: siteSeo.homeKeywords,
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
      locale: "uk_UA",
      url: siteUrl(baseUrl),
      siteName: "Ave Maria Beauty Lab",
      title: siteSeo.siteTitle,
      description: siteSeo.homeDescription,
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
      title: siteSeo.siteTitle,
      description: siteSeo.homeDescription,
      images: [`${baseUrl}${MEDIA.hero}`],
    },
    alternates: pageAlternates(),
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

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteHtmlShell>{children}</SiteHtmlShell>;
}
