import { contactsContent } from "@/lib/content/contacts";
import {
  SITE_EMAIL,
  SITE_INSTAGRAM,
  SITE_INSTAGRAM_HANDLE,
  SITE_MAP_EMBED,
  SITE_MAP_LINK,
  SITE_PHONE,
  SITE_PHONE_DISPLAY,
  SITE_PICKUP_ADDRESS,
} from "@/lib/siteContact";

export default function ContactsContent() {
  const c = contactsContent;

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
            <p className="contacts-lead" style={{ marginBottom: 16 }}>
              {c.pickupNote}
            </p>
            <ul className="contacts-meta">
              <li>
                <span>{c.labels.address}</span>
                <a
                  href={SITE_MAP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {SITE_PICKUP_ADDRESS}
                </a>
              </li>
              <li>
                <span>{c.labels.instagram}</span>
                <a
                  href={SITE_INSTAGRAM}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {SITE_INSTAGRAM_HANDLE}
                </a>
              </li>
              <li>
                <span>{c.labels.phone}</span>
                <a href={`tel:${SITE_PHONE}`}>{SITE_PHONE_DISPLAY}</a>
              </li>
              <li>
                <span>{c.labels.email}</span>
                <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>
              </li>
            </ul>
          </section>

          <section className="contacts-block">
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
