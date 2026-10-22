import { resolveSetting } from "@/lib/settings";

export type MarketingConfig = {
  gtmId: string;
  ga4Id: string;
  googleAdsId: string;
  metaPixelId: string;
  tiktokPixelId: string;
};

function pick(raw: string, pattern: RegExp): string {
  const t = raw.trim();
  return pattern.test(t) ? t : "";
}

const GTM = /^GTM-[A-Z0-9]+$/i;
const GA = /^(G|GT|AW|DC)-[A-Z0-9]+$/i;
const META_PIXEL = /^\d{5,25}$/;
const TIKTOK = /^[A-Z0-9]{10,40}$/i;

export async function getMarketingConfig(): Promise<MarketingConfig> {
  const [gtmRaw, gaRaw, adsRaw, metaRaw, tiktokRaw] = await Promise.all([
    resolveSetting("gtm_id", [process.env.NEXT_PUBLIC_GTM_ID]),
    resolveSetting("google_tag_id", [
      process.env.NEXT_PUBLIC_G_ID,
      process.env.NEXT_PUBLIC_GA_ID,
    ]),
    resolveSetting("google_ads_id", [process.env.NEXT_PUBLIC_GOOGLE_ADS_ID]),
    resolveSetting("meta_pixel_id", [process.env.NEXT_PUBLIC_META_PIXEL_ID]),
    resolveSetting("tiktok_pixel_id", [process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID]),
  ]);

  return {
    gtmId: pick(gtmRaw, GTM),
    ga4Id: pick(gaRaw, GA),
    googleAdsId: pick(adsRaw, GA),
    metaPixelId: pick(metaRaw, META_PIXEL),
    tiktokPixelId: pick(tiktokRaw, TIKTOK),
  };
}
