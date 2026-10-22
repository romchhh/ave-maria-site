"use client";

import Link from "next/link";
import { useAppContext } from "@/lib/GeneralProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { sitePath } from "@/lib/i18n/paths";
import {
  SITE_INSTAGRAM,
  SITE_INSTAGRAM_HANDLE,
} from "@/lib/siteContact";

export default function SidebarMenu() {
  const { t } = useI18n();
  const { isMenuOpen, closePanels } = useAppContext();

  const links = [
    { href: sitePath("catalog"), label: t.nav.catalog },
    { href: sitePath("catalog?category=hair"), label: "Волосся" },
    { href: sitePath("catalog?category=face"), label: "Обличчя" },
    { href: sitePath("catalog?category=body"), label: "Тіло" },
    { href: sitePath("catalog?category=new"), label: t.nav.new },
    { href: sitePath("about"), label: t.nav.about },
    { href: sitePath("contacts"), label: t.nav.stores },
    { href: sitePath("shipping-payment"), label: "Оплата і доставка" },
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
          <Link href={`${sitePath()}#about`} onClick={closePanels}>
            Ave Maria Beauty Lab
          </Link>
        </div>
      </div>
    </div>
  );
}
