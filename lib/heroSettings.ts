import { promises as fs } from "node:fs";
import path from "node:path";
import { getMessages } from "@/lib/i18n/messages";
import { query } from "@/lib/db";
import { MEDIA } from "@/lib/media";
import { stripMediaQuery } from "@/lib/mediaUrl";
import { getSettings } from "@/lib/settings";

export type HeroContent = {
  image: string;
  imageMobile: string;
  /** Змінюється при збереженні в адмінці або заміні файлу на диску — для ?v= у URL */
  imageVersion: number;
  imageMobileVersion: number;
  title: string;
  eyebrow: string;
  lead: string;
  cta: string;
};

async function heroImageCacheVersion(
  settingKey: "hero_image" | "hero_image_mobile",
  imagePath: string
): Promise<number> {
  try {
    const rows = await query<{ updated_at: Date }>(
      `SELECT updated_at FROM site_settings WHERE key = $1 LIMIT 1`,
      [settingKey]
    );
    if (rows[0]?.updated_at) {
      return new Date(rows[0].updated_at).getTime();
    }
  } catch {
    /* DB may be unavailable during build */
  }

  const rel = imagePath.replace(/^\/assets\/hero\//, "").split("?")[0];
  if (!rel || rel.includes("..") || rel.includes("/")) return 0;
  const filePath = path.join(process.cwd(), "public", "assets", "hero", rel);
  try {
    const st = await fs.stat(filePath);
    return st.mtimeMs;
  } catch {
    return 0;
  }
}

export async function getHeroContent(): Promise<HeroContent> {
  const t = getMessages().home;
  const s = await getSettings();

  const image = stripMediaQuery(s.hero_image) || MEDIA.hero;
  const imageMobile =
    stripMediaQuery(s.hero_image_mobile) || image;
  const imageVersion = await heroImageCacheVersion("hero_image", image);
  const imageMobileVersion = s.hero_image_mobile.trim()
    ? await heroImageCacheVersion("hero_image_mobile", imageMobile)
    : imageVersion;

  return {
    image,
    imageMobile,
    imageVersion,
    imageMobileVersion,
    title: s.hero_title.trim() || "AVE MARIA",
    eyebrow: s.hero_eyebrow.trim() || t.eyebrow,
    lead: s.hero_lead.trim() || t.lead,
    cta: s.hero_cta.trim() || t.cta,
  };
}
