export const SETTING_KEYS = [
  "telegram_bot_token",
  "telegram_chat_id",
  "nova_poshta_api_key",
  "site_url",
  "gtm_id",
  "google_tag_id",
  "google_ads_id",
  "meta_pixel_id",
  "tiktok_pixel_id",
  "hero_image",
  "hero_title",
  "hero_eyebrow",
  "hero_lead",
  "hero_cta",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export type SettingsMap = Record<SettingKey, string>;

export const MARKETING_SETTING_KEYS = [
  "gtm_id",
  "google_tag_id",
  "google_ads_id",
  "meta_pixel_id",
  "tiktok_pixel_id",
] as const satisfies readonly SettingKey[];

export const HERO_SETTING_KEYS = [
  "hero_image",
  "hero_title",
  "hero_eyebrow",
  "hero_lead",
  "hero_cta",
] as const satisfies readonly SettingKey[];
