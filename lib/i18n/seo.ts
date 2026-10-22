import { siteUrl } from "@/lib/i18n/paths";

export const HTML_LANG = "uk";

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://avemariabeautylab.com"
  );
}

export function pageAlternates(path = "") {
  const base = getSiteUrl();
  return {
    canonical: siteUrl(base, path),
  };
}

export const siteSeo = {
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
};
