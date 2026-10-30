"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppContext } from "@/lib/GeneralProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { sitePath } from "@/lib/i18n/paths";
import type { NavCategoryItem } from "@/lib/navCategories";
import {
  SITE_INSTAGRAM,
  SITE_INSTAGRAM_HANDLE,
} from "@/lib/siteContact";

type SidebarMenuProps = {
  navCategories?: NavCategoryItem[];
};

export default function SidebarMenu({ navCategories = [] }: SidebarMenuProps) {
  const { t } = useI18n();
  const { isMenuOpen, closePanels } = useAppContext();
  const [openId, setOpenId] = useState<string | null>(null);

  const fallbackCats: NavCategoryItem[] = [
    { id: "hair", label: "Волосся", href: sitePath("catalog?category=hair"), children: [] },
    { id: "face", label: "Обличчя", href: sitePath("catalog?category=face"), children: [] },
    { id: "body", label: "Тіло", href: sitePath("catalog?category=body"), children: [] },
  ];
  const shopCats = navCategories.length ? navCategories : fallbackCats;

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
          <Link href={sitePath("catalog")} onClick={closePanels}>
            {t.nav.catalog}
          </Link>

          {shopCats.map((cat) =>
            cat.children.length > 0 ? (
              <div key={cat.id} className="mobile-nav-group">
                <div className="mobile-nav-row">
                  <Link href={cat.href} onClick={closePanels}>
                    {cat.label}
                  </Link>
                  <button
                    type="button"
                    className="mobile-nav-toggle"
                    aria-expanded={openId === cat.id}
                    aria-label={t.catalog.concernPick}
                    onClick={() =>
                      setOpenId((id) => (id === cat.id ? null : cat.id))
                    }
                  >
                    {openId === cat.id ? "−" : "+"}
                  </button>
                </div>
                {openId === cat.id && (
                  <div className="mobile-nav-subs">
                    <p className="mobile-nav-subs-label">
                      {t.catalog.concernPick}
                    </p>
                    {cat.children.map((sub) => (
                      <Link
                        key={sub.id}
                        href={sub.href}
                        onClick={closePanels}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link key={cat.id} href={cat.href} onClick={closePanels}>
                {cat.label}
              </Link>
            )
          )}

          <Link href={sitePath("catalog?category=new")} onClick={closePanels}>
            {t.nav.new}
          </Link>
          <Link
            href={sitePath("catalog?category=sale")}
            className="is-sale-nav"
            onClick={closePanels}
          >
            {t.home.sale}
          </Link>
          <Link href={sitePath("about")} onClick={closePanels}>
            {t.nav.about}
          </Link>
          <Link href={sitePath("contacts")} onClick={closePanels}>
            {t.footer.contactsPage}
          </Link>
          <Link href={sitePath("shipping-payment")} onClick={closePanels}>
            Оплата і доставка
          </Link>
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
