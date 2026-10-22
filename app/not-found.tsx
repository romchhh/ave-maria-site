import type { Metadata } from "next";
import NotFoundView from "@/components/shared/NotFoundView";
import JsonLd from "@/components/shared/JsonLd";
import { getMessages } from "@/lib/i18n/messages";
import { getSiteUrl } from "@/lib/i18n/seo";
import { MEDIA } from "@/lib/media";
import { generateWebPageStructuredData } from "@/lib/seo";
import { buildPageMetadata } from "@/lib/seo/metadata";
import "./(site)/globals.css";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;0,6..96,700;1,6..96,400;1,6..96,500;1,6..96,600&family=Outfit:wght@300;400;500;600;700&display=swap";

const t = getMessages();

export const metadata: Metadata = buildPageMetadata({
  title: `${t.notFound.title} (404)`,
  description: t.notFound.lead,
  noIndex: true,
});

export default function NotFound() {
  return (
    <html lang="uk">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={MEDIA.logo} type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={FONTS_HREF} />
      </head>
      <body>
        <JsonLd
          data={generateWebPageStructuredData({
            name: t.notFound.title,
            description: t.notFound.lead,
            path: "404",
            baseUrl: getSiteUrl(),
          })}
        />
        <NotFoundView />
      </body>
    </html>
  );
}
