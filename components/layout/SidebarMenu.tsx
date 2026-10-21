"use client";

import Link from "next/link";
import { useAppContext } from "@/lib/GeneralProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import {
  SITE_INSTAGRAM,
  SITE_INSTAGRAM_HANDLE,
} from "@/lib/siteContact";

export default function SidebarMenu({ lang }: { lang: Locale }) {
  const { t } = useI18n();
  const { isMenuOpen, closePanels } = useAppContext();

  const links = [
    { href: `/${lang}/catalog`, label: t.nav.catalog },
    { href: `/${lang}/catalog?category=hair`, label: "Волосся" },
    { href: `/${lang}/catalog?category=face`, label: "Обличчя" },
    { href: `/${lang}/catalog?category=body`, label: "Тіло" },
    { href: `/${lang}/catalog?category=new`, label: t.nav.new },
    { href: `/${lang}/about`, label: t.nav.about },
    { href: `/${lang}/contacts`, label: t.nav.stores },
    { href: `/${lang}/shipping-payment`, label: "Оплата і доставка" },
  ];

  return (
    <div
      className={`mobile-menu${isMenuOpen ? " open" : ""}`}
      aria-hidden={!isMenuOpen}
      onClick={(e) => {
        if (e.target === e.currentTarget) closePanels();
      }}
    >
      <div className="mobile-menu-panel">
        <div className="mobile-menu-head">
          <h2>{t.nav.menu}</h2>
          <button type="button" onClick={closePanels} aria-label={t.a11y.close}>
            ×
          </button>
        </div>
        <nav>
          {links.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={closePanels}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mobile-menu-foot">
          <a href={SITE_INSTAGRAM} target="_blank" rel="noopener noreferrer">
            {SITE_INSTAGRAM_HANDLE}
          </a>
          <Link href={`/${lang}#about`} onClick={closePanels}>
            Ave Maria Beauty Lab
          </Link>
        </div>
      </div>
    </div>
  );
}
