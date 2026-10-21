import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  type Locale,
} from "@/lib/i18n/config";

export const HTML_LANG: Record<Locale, string> = {
  uk: "uk",
};

export const OG_LOCALE: Record<Locale, string> = {
  uk: "uk_UA",
};

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://avemariabeautylab.com"
  );
}

export function parseLangParam(raw: string): Locale {
  return isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;
}

export function generateLocaleStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export function pageAlternates(lang: Locale, path = "") {
  const base = getSiteUrl();
  const suffix = path ? `/${path.replace(/^\//, "")}` : "";
  return {
    canonical: `${base}/${lang}${suffix}`,
  };
}

export const seoCopy: Record<
  Locale,
  {
    siteTitle: string;
    homeDescription: string;
    homeKeywords: string[];
    catalogTitle: string;
    catalogDescription: string;
  }
> = {
  uk: {
    siteTitle: "Ave Maria Beauty Lab — мультибрендовий магазин косметики",
    homeDescription:
      "Ave Maria Beauty Lab — твоя щоденна розкіш. Hair, skin, body, face — догляд і аромати для кожного дня.",
    homeKeywords: [
      "Ave Maria Beauty Lab",
      "косметика",
      "парфуми",
      "догляд за тілом",
      "аромати для дому",
    ],
    catalogTitle: "Каталог",
    catalogDescription:
      "Онлайн-каталог Ave Maria Beauty Lab — креми, парфуми, місти та аромати для дому.",
  },
};
