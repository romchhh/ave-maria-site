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
import { MEDIA } from "@/lib/media";
import {
  MarketingNoScript,
  MarketingScripts,
} from "@/components/marketing/MarketingScripts";
import { getMarketingConfig } from "@/lib/marketingSettings";
import { buildSiteJsonLdGraph } from "@/lib/seo";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;0,6..96,700;1,6..96,400;1,6..96,500;1,6..96,600&family=Montserrat:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap";

export default async function SiteHtmlShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const baseUrl = getSiteUrl();
  const marketing = await getMarketingConfig();

  return (
    <html lang={HTML_LANG}>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta name="format-detection" content="telephone=no" />
        <link rel="icon" href={MEDIA.logo} type="image/png" />
        <link rel="apple-touch-icon" href={MEDIA.logo} />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#F2EBE2" />
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
        <link
          rel="alternate"
          type="text/plain"
          href={`${baseUrl}/llms.txt`}
          title="LLM site guide"
        />
      </head>
      <body>
        <div className="site-texture" aria-hidden="true" />
        <MarketingNoScript config={marketing} />
        <MarketingScripts config={marketing} />
        <JsonLd data={buildSiteJsonLdGraph(baseUrl)} />
        <I18nProvider>
          <AppProvider>
            <BasketProvider>
              <WishlistProvider>
                <div className="site-root">
                  <Header />
                  <main>{children}</main>
                  <Footer />
                </div>
                <SidebarMenu />
                <SidebarBasket />
                <SidebarSearch />
              </WishlistProvider>
            </BasketProvider>
          </AppProvider>
        </I18nProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
