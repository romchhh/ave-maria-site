import Image from "next/image";
import Link from "next/link";
import { getMessages } from "@/lib/i18n/messages";
import { sitePath } from "@/lib/i18n/paths";
import { MEDIA } from "@/lib/media";
import { SITE_NAME } from "@/lib/siteContact";

export default function About() {
  const t = getMessages();

  return (
    <section className="home-about" id="about">
      <div className="home-about-bg" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="home-about-bg-img"
          src={MEDIA.aboutStillLife}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <div className="home-about-bg-scrim" />
      </div>
      <div className="home-about-inner">
        <div className="home-about-visual">
          <Image
            className="home-about-logo"
            src={MEDIA.logo}
            alt={SITE_NAME}
            width={280}
            height={232}
            sizes="(max-width: 900px) 40vw, 200px"
          />
        </div>
        <div className="home-about-copy">
          <h2>{t.home.aboutTitle}</h2>
          <p>{t.home.aboutText}</p>
          <Link href={sitePath("about")} className="home-about-more">
            {t.home.aboutReadMore}
          </Link>
        </div>
      </div>
    </section>
  );
}
