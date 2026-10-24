import { contactsContent } from "@/lib/content/contacts";
import {
  SITE_ADDRESS_LINES,
  SITE_EMAIL,
  SITE_INSTAGRAM,
  SITE_INSTAGRAM_HANDLE,
  SITE_MAP_EMBED,
  SITE_MAP_LINK,
  SITE_PHONE,
  SITE_PHONE_DISPLAY,
  SITE_STUDIO_NAME,
} from "@/lib/siteContact";

export default function ContactsContent() {
  const c = contactsContent;

  const rows = [
    {
      label: c.labels.address,
      href: SITE_MAP_LINK,
      external: true,
      value: (
        <>
          <span className="contacts-meta-line">{SITE_STUDIO_NAME}</span>
          <span className="contacts-meta-line">{SITE_ADDRESS_LINES[0]}</span>
        </>
      ),
    },
    {
      label: c.labels.instagram,
      href: SITE_INSTAGRAM,
      external: true,
      value: SITE_INSTAGRAM_HANDLE,
    },
    {
      label: c.labels.phone,
      href: `tel:${SITE_PHONE}`,
      value: SITE_PHONE_DISPLAY,
    },
    {
      label: c.labels.email,
      href: `mailto:${SITE_EMAIL}`,
      value: SITE_EMAIL,
    },
  ] as const;

  return (
    <article className="contacts-page">
      <header className="contacts-head">
        <h1 className="contacts-title">{c.title}</h1>
        <p className="contacts-lead">{c.lead}</p>
      </header>

      <div className="contacts-grid">
        <div className="contacts-copy">
          <section className="contacts-block">
            <h2>{c.studioHeading}</h2>
            <p className="contacts-note">{c.pickupNote}</p>

            <dl className="contacts-meta">
              {rows.map((row) => (
                <div key={row.label} className="contacts-meta-row">
                  <dt>{row.label}</dt>
                  <dd>
                    <a
                      href={row.href}
                      {...(row.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {row.value}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="contacts-block contacts-block--reply">
            <h2>{c.replyHeading}</h2>
            <ul className="contacts-list">
              {c.replyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="contacts-map">
          <iframe
            title={c.studioHeading}
            src={SITE_MAP_EMBED}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <a
            className="contacts-map-link"
            href={SITE_MAP_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            {c.mapLink}
          </a>
        </div>
      </div>
    </article>
  );
}
