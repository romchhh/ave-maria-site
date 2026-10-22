import { revalidatePath, revalidateTag } from "next/cache";
import { query } from "@/lib/db";
import { stripMediaQuery } from "@/lib/mediaUrl";
import {
  SETTING_KEYS,
  type SettingKey,
  type SettingsMap,
} from "@/lib/settingsTypes";

export {
  SETTING_KEYS,
  HERO_SETTING_KEYS,
  type SettingKey,
  type SettingsMap,
} from "@/lib/settingsTypes";

const SECRET_KEYS = new Set<SettingKey>([
  "telegram_bot_token",
  "nova_poshta_api_key",
]);

function emptySettings(): SettingsMap {
  return {
    telegram_bot_token: "",
    telegram_chat_id: "",
    nova_poshta_api_key: "",
    site_url: "",
    gtm_id: "",
    google_tag_id: "",
    google_ads_id: "",
    meta_pixel_id: "",
    tiktok_pixel_id: "",
    hero_image: "",
    hero_image_mobile: "",
    hero_title: "",
    hero_eyebrow: "",
    hero_lead: "",
    hero_cta: "",
  };
}

export async function getSettings(): Promise<SettingsMap> {
  const out = emptySettings();
  try {
    const rows = await query<{ key: string; value: string }>(
      `SELECT key, value FROM site_settings WHERE key = ANY($1::text[])`,
      [SETTING_KEYS as unknown as string[]]
    );
    for (const row of rows) {
      if ((SETTING_KEYS as readonly string[]).includes(row.key)) {
        out[row.key as SettingKey] = row.value ?? "";
      }
    }
  } catch {
    /* table may not exist yet during first boot */
  }
  return out;
}

export async function getSetting(key: SettingKey): Promise<string> {
  const settings = await getSettings();
  return settings[key] || "";
}

/** DB value wins; otherwise fall back to env. */
export async function resolveSetting(
  key: SettingKey,
  envFallbacks: (string | undefined)[] = []
): Promise<string> {
  const fromDb = (await getSetting(key)).trim();
  if (fromDb) return fromDb;
  for (const v of envFallbacks) {
    if (v?.trim()) return v.trim();
  }
  return "";
}

function bustSiteCache() {
  try {
    revalidateTag("settings");
    revalidatePath("/", "layout");
    revalidatePath("/catalog");
  } catch (err) {
    console.warn("[bustSiteCache]", err);
  }
}

export async function upsertSettings(
  patch: Partial<Record<SettingKey, string>>
): Promise<SettingsMap> {
  for (const key of SETTING_KEYS) {
    if (!(key in patch)) continue;
    let value = String(patch[key] ?? "");
    // Keep previous secret if client sent masked placeholder
    if (SECRET_KEYS.has(key) && value.includes("••••")) continue;
    if (key === "hero_image" || key === "hero_image_mobile") {
      value = stripMediaQuery(value);
    }

    await query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = NOW()`,
      [key, value]
    );
  }
  bustSiteCache();
  return getSettings();
}

export function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

/** Safe payload for admin UI (secrets masked). */
export async function getSettingsForAdmin(): Promise<{
  values: SettingsMap;
  masked: Partial<Record<SettingKey, string>>;
  fromEnv: Partial<Record<SettingKey, boolean>>;
}> {
  const values = await getSettings();
  const masked: Partial<Record<SettingKey, string>> = {};
  const fromEnv: Partial<Record<SettingKey, boolean>> = {};

  const envMap: SettingsMap = {
    telegram_bot_token: process.env.BOT_TOKEN || "",
    telegram_chat_id: process.env.CHAT_ID || "",
    nova_poshta_api_key:
      process.env.NOVA_POSHTA_API_KEY ||
      process.env.NEXT_PUBLIC_NOVA_POSHTA_API_KEY ||
      "",
    site_url: process.env.NEXT_PUBLIC_SITE_URL || "",
    gtm_id: process.env.NEXT_PUBLIC_GTM_ID || "",
    google_tag_id:
      process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_G_ID || "",
    google_ads_id: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "",
    meta_pixel_id: process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
    tiktok_pixel_id: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "",
    hero_image: "",
    hero_image_mobile: "",
    hero_title: "",
    hero_eyebrow: "",
    hero_lead: "",
    hero_cta: "",
  };

  for (const key of SETTING_KEYS) {
    if (!values[key] && envMap[key]) {
      fromEnv[key] = true;
    }
    if (SECRET_KEYS.has(key)) {
      const raw = values[key] || envMap[key];
      masked[key] = raw ? maskSecret(raw) : "";
    }
  }

  return { values, masked, fromEnv };
}
