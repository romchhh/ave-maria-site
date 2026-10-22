import ContentPage from "@/components/shared/ContentPage";
import { aboutContent } from "@/lib/content/about";
import { MEDIA } from "@/lib/media";

export default function AboutContent() {
  const c = aboutContent;

  return (
    <>
      <div className="about-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MEDIA.aboutHero} alt="" aria-hidden="true" />
      </div>

      <ContentPage title={c.title} lead={c.lead}>
        <section className="content-block">
          <h2>{c.sectionTitle}</h2>
          <ul className="content-list">
            {c.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <figure className="about-quote">
          <figcaption className="about-quote-title">{c.closingTitle}</figcaption>
          <blockquote>
            {c.closing.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </blockquote>
        </figure>
      </ContentPage>
    </>
  );
}
