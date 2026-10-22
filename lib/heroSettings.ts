import { getMessages } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/config";
import { MEDIA } from "@/lib/media";
import { stripMediaQuery } from "@/lib/mediaUrl";
import { getSettings } from "@/lib/settings";

export type HeroContent = {
  image: string;
  title: string;
  eyebrow: string;
  lead: string;
  cta: string;
};

export async function getHeroContent(lang: Locale): Promise<HeroContent> {
  const t = getMessages(lang).home;
  const s = await getSettings();

  const image = stripMediaQuery(s.hero_image) || MEDIA.hero;

  return {
    image,
    title: s.hero_title.trim() || "AVE MARIA",
    eyebrow: s.hero_eyebrow.trim() || t.eyebrow,
    lead: s.hero_lead.trim() || t.lead,
    cta: s.hero_cta.trim() || t.cta,
  };
}
