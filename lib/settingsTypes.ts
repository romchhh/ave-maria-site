export const SETTING_KEYS = [
  "telegram_bot_token",
  "telegram_chat_id",
  "nova_poshta_api_key",
  "site_url",
  "hero_image",
  "hero_title",
  "hero_eyebrow",
  "hero_lead",
  "hero_cta",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export type SettingsMap = Record<SettingKey, string>;

export const HERO_SETTING_KEYS = [
  "hero_image",
  "hero_title",
  "hero_eyebrow",
  "hero_lead",
  "hero_cta",
] as const satisfies readonly SettingKey[];
