import Link from "next/link";
import HeroMedia from "@/components/main-page/HeroMedia";
import { getHeroContent } from "@/lib/heroSettings";
import { sitePath } from "@/lib/i18n/paths";
import { withMediaCacheBust } from "@/lib/mediaUrl";
import { MEDIA } from "@/lib/media";
import { SITE_NAME } from "@/lib/siteContact";

export default async function Hero() {
  const hero = await getHeroContent();
  // Stable bust only — never Date.now() (breaks cache / slows Telegram WebView).
  const src = hero.imageVersion
    ? withMediaCacheBust(hero.image, hero.imageVersion)
    : hero.image;

  return (
    <div className="home-hero-stage">
      <div className="home-hero">
        <div className="home-hero__media">
          <HeroMedia
            src={src}
            alt={`${SITE_NAME} — косметика`}
            frameDesktop={hero.frameDesktop}
            frameMobile={hero.frameMobile}
          />
        </div>
      </div>
      <div className="home-content">
        <div className="home-cta-wrap">
          <Link href={sitePath("catalog")} className="home-cta">
            {hero.cta}
          </Link>
        </div>
        <div className="home-bottom">
          <div className="home-copy">
            <div className="eyebrow">{hero.eyebrow}</div>
            <p>{hero.lead}</p>
          </div>
          <div className="home-title">{hero.title}</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="home-mark"
            src={MEDIA.logo}
            alt=""
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
