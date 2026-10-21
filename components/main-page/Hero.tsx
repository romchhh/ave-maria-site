import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { MEDIA } from "@/lib/media";
import { SITE_NAME } from "@/lib/siteContact";

export default function Hero({ lang }: { lang: Locale }) {
  const t = getMessages(lang);

  return (
    <div className="home-hero-stage">
      <div className="home-hero">
        <Image
          src={MEDIA.hero}
          alt={`${SITE_NAME} — косметика`}
          fill
          priority
          sizes="100vw"
          quality={85}
          style={{ objectFit: "cover", objectPosition: "center 30%" }}
        />
      </div>
      <div className="home-content">
        <div className="home-cta-wrap">
          <Link href={`/${lang}/catalog`} className="home-cta">
            {t.home.cta}
          </Link>
        </div>
        <div className="home-bottom">
          <div className="home-copy">
            <div className="eyebrow">{t.home.eyebrow}</div>
            <p>{t.home.lead}</p>
          </div>
          <div className="home-title">AVE MARIA</div>
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
