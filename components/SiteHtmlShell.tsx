import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SidebarBasket from "@/components/layout/SidebarBasket";
import SidebarMenu from "@/components/layout/SidebarMenu";
import SidebarSearch from "@/components/layout/SidebarSearch";
import JsonLd from "@/components/shared/JsonLd";
import RegisterSW from "@/components/shared/RegisterSW";
import { AppProvider } from "@/lib/GeneralProvider";
import { BasketProvider } from "@/lib/BasketProvider";
import { WishlistProvider } from "@/lib/WishlistProvider";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { HTML_LANG, getSiteUrl } from "@/lib/i18n/seo";
import type { Locale } from "@/lib/i18n/config";
import { MEDIA } from "@/lib/media";
import {
  generateOrganizationStructuredData,
  generateWebsiteStructuredData,
} from "@/lib/seo";

/** Same stack as prototypes/public/ave-maria.html */
const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;0,6..96,700;1,6..96,400;1,6..96,500;1,6..96,600&family=Montserrat:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap";

export default function SiteHtmlShell({
  lang,
  children,
}: {
  lang: Locale;
  children: React.ReactNode;
}) {
  const baseUrl = getSiteUrl();

  return (
    <html lang={HTML_LANG[lang]}>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta name="format-detection" content="telephone=no" />
        <link rel="icon" href={MEDIA.logo} type="image/png" />
        <link rel="apple-touch-icon" href={MEDIA.logo} />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0B0B0B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link href={FONTS_HREF} rel="stylesheet" />
        <link rel="preload" href={MEDIA.logo} as="image" />
        <link rel="preload" href={MEDIA.hero} as="image" />
        <link rel="dns-prefetch" href={baseUrl} />
      </head>
      <body>
        <JsonLd data={generateOrganizationStructuredData(baseUrl)} />
        <JsonLd data={generateWebsiteStructuredData(baseUrl)} />
        <I18nProvider lang={lang}>
          <AppProvider>
            <BasketProvider>
              <WishlistProvider>
                <Header lang={lang} />
                <SidebarMenu lang={lang} />
                <SidebarBasket />
                <SidebarSearch lang={lang} />
                <main>{children}</main>
                <Footer lang={lang} />
              </WishlistProvider>
            </BasketProvider>
          </AppProvider>
        </I18nProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
