"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { sitePath } from "@/lib/i18n/paths";
import { MEDIA } from "@/lib/media";
import { SITE_INSTAGRAM, SITE_NAME } from "@/lib/siteContact";

/** Slogan category chips → catalog filters (no separate `skin` category → face). */
const SLOGAN_CATEGORIES = [
  { label: "hair", categoryId: "hair" },
  { label: "skin", categoryId: "face" },
  { label: "body", categoryId: "body" },
  { label: "face", categoryId: "face" },
] as const;

export default function Footer() {
  const { t } = useI18n();

  const navLinks = [
    { href: sitePath("about"), label: t.footer.about },
    { href: sitePath("contacts"), label: t.footer.contactsPage },
    { href: sitePath("shipping-payment"), label: t.footer.shipping },
    { href: sitePath("shipping-payment"), label: t.footer.payment },
    { href: sitePath("returns"), label: t.footer.returns },
    { href: sitePath("contacts"), label: t.nav.stores },
    {
      href: SITE_INSTAGRAM,
      label: t.footer.instagram,
      external: true,
    },
  ];

  const legalLinks = [
    { href: sitePath("privacy-policy"), label: t.footer.privacy },
    { href: sitePath("terms-of-service"), label: t.footer.offer },
  ];

  return (
    <footer className="site-foot">
      <div
        className="site-foot-waves"
        style={{ backgroundImage: `url(${MEDIA.footerWaves})` }}
        aria-hidden="true"
      />

      <div className="site-foot-inner">
        <p className="site-foot-slogan">
          {t.footer.slogan}{" "}
          {SLOGAN_CATEGORIES.map((item, i) => (
            <span key={item.label}>
              {i > 0 && ", "}
              <Link
                href={sitePath(`catalog?category=${item.categoryId}`)}
                className="site-foot-slogan-link"
              >
                {item.label}
              </Link>
            </span>
          ))}
        </p>

        <nav className="site-foot-nav" aria-label="Footer">
          {navLinks.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.label}
              </a>
            ) : (
              <Link key={item.label + item.href} href={item.href}>
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="site-foot-bottom">
          <span>
            © {SITE_NAME} {new Date().getFullYear()}
          </span>
          <span className="site-foot-bottom-links">
            {legalLinks.map((item, i) => (
              <span key={item.href}>
                {i > 0 && " · "}
                <Link href={item.href}>{item.label}</Link>
              </span>
            ))}
          </span>
          <p className="site-foot-credit">
            {t.footer.developedBy}{" "}
            <a
              href="https://telebots.site/uk"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.footer.developedByName}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
