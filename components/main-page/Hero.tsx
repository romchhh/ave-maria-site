import Link from "next/link";
import { getHeroContent } from "@/lib/heroSettings";
import { sitePath } from "@/lib/i18n/paths";
import { withMediaCacheBust } from "@/lib/mediaUrl";
import { MEDIA } from "@/lib/media";
import { SITE_NAME } from "@/lib/siteContact";

export default async function Hero() {
  const hero = await getHeroContent();
  const version = hero.imageVersion || Date.now();
  const src = withMediaCacheBust(hero.image, version);

  return (
    <div className="home-hero-stage">
      <div className="home-hero">
        <div className="home-hero__media">
          {/* Native img — без next/image, щоб не стискало якість */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${SITE_NAME} — косметика`}
            className="home-hero__img"
            fetchPriority="high"
            decoding="async"
            draggable={false}
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
