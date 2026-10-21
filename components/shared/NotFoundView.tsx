import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { MEDIA } from "@/lib/media";
import { SITE_NAME } from "@/lib/siteContact";

export default function NotFoundView({
  lang = DEFAULT_LOCALE,
}: {
  lang?: Locale;
}) {
  const t = getMessages(lang);

  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <div className="not-found-atmosphere" aria-hidden />
      <div className="not-found-inner">
        <p className="not-found-brand">{SITE_NAME}</p>
        <p className="not-found-code" aria-hidden>
          {t.notFound.code}
        </p>
        <h1 id="not-found-title" className="not-found-title">
          {t.notFound.title}
        </h1>
        <p className="not-found-lead">{t.notFound.lead}</p>
        <div className="not-found-actions">
          <Link href={`/${lang}`} className="not-found-cta is-primary">
            {t.notFound.home}
          </Link>
          <Link href={`/${lang}/catalog`} className="not-found-cta is-ghost">
            {t.notFound.catalog}
          </Link>
        </div>
        <Image
          className="not-found-mark"
          src={MEDIA.logo}
          alt=""
          width={72}
          height={72}
          aria-hidden
        />
      </div>
    </section>
  );
}
