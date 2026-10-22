import type { Locale } from "@/lib/i18n/config";
import { getLegalPage } from "@/lib/content/legal";
import {
  SITE_EMAIL,
  SITE_INSTAGRAM,
  SITE_INSTAGRAM_HANDLE,
  SITE_PHONE,
  SITE_PHONE_DISPLAY,
  SITE_PICKUP_ADDRESS,
  SITE_STUDIO_NAME,
} from "@/lib/siteContact";

export default function ContactsContent({ lang }: { lang: Locale }) {
  const page = getLegalPage(lang, "contacts");
  if (!page) return null;

  const replySection = page.sections.find((s) => s.bullets?.length);

  return (
    <article className="contacts-page">
      <header className="contacts-head">
        <h1 className="contacts-title">{page.title}</h1>
        {page.intro && <p className="contacts-lead">{page.intro}</p>}
      </header>

      <div className="contacts-grid">
        <div className="contacts-copy">
          <section className="contacts-block">
            <h2>{SITE_STUDIO_NAME}</h2>
            <p className="contacts-lead" style={{ marginBottom: 16 }}>
              Самовивіз · перед візитом запишіться онлайн або зателефонуйте.
            </p>
            <ul className="contacts-meta">
              <li>
                <span>Адреса</span>
                <span>{SITE_PICKUP_ADDRESS}</span>
              </li>
              <li>
                <span>Instagram</span>
                <a href={SITE_INSTAGRAM} target="_blank" rel="noopener noreferrer">
                  {SITE_INSTAGRAM_HANDLE}
                </a>
              </li>
              <li>
                <span>Телефон</span>
                <a href={`tel:${SITE_PHONE}`}>{SITE_PHONE_DISPLAY}</a>
              </li>
              <li>
                <span>Email</span>
                <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>
              </li>
            </ul>
          </section>

          {replySection && (
            <section className="contacts-block">
              <h2>{replySection.heading}</h2>
              <ul className="contacts-list">
                {replySection.bullets?.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
