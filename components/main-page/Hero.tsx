import Link from "next/link";
import { getHeroContent } from "@/lib/heroSettings";
import { sitePath } from "@/lib/i18n/paths";
import { withMediaCacheBust } from "@/lib/mediaUrl";
import { MEDIA } from "@/lib/media";
import { SITE_NAME } from "@/lib/siteContact";

export default async function Hero() {
  const hero = await getHeroContent();
  const versionDesktop = hero.imageVersion || Date.now();
  const versionMobile = hero.imageMobileVersion || versionDesktop;
  const srcDesktop = withMediaCacheBust(hero.image, versionDesktop);
  const srcMobile = withMediaCacheBust(hero.imageMobile, versionMobile);

  return (
    <div className="home-hero-stage">
      <div className="home-hero">
        <div className="home-hero__media">
          <picture className="home-hero__picture">
            <source
              media="(max-width: 1100px)"
              srcSet={srcMobile}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={srcDesktop}
              alt={`${SITE_NAME} — косметика`}
              className="home-hero__img"
              fetchPriority="high"
              decoding="async"
              draggable={false}
            />
          </picture>
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
