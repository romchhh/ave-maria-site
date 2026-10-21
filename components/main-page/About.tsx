import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { MEDIA } from "@/lib/media";
import {
  SITE_INSTAGRAM,
  SITE_INSTAGRAM_HANDLE,
  SITE_NAME,
} from "@/lib/siteContact";

export default function About({ lang }: { lang: Locale }) {
  const t = getMessages(lang);

  return (
    <section className="home-about" id="about">
      <div className="home-about-inner">
        <Image
          className="home-about-logo"
          src={MEDIA.logo}
          alt={SITE_NAME}
          width={280}
          height={232}
          sizes="(max-width: 900px) 70vw, 280px"
        />
        <div>
          <h2>{t.home.aboutTitle}</h2>
          <p>{t.home.aboutText}</p>
          <a
            className="ig-link"
            href={SITE_INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
          >
            {SITE_INSTAGRAM_HANDLE}
          </a>
        </div>
      </div>
    </section>
  );
}
