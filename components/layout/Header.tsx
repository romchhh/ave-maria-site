"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppContext } from "@/lib/GeneralProvider";
import { useBasket } from "@/lib/BasketProvider";
import { useWishlist } from "@/lib/WishlistProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { sitePath } from "@/lib/i18n/paths";
import { MEDIA } from "@/lib/media";
import { SITE_NAME } from "@/lib/siteContact";

export default function Header() {
  const { t } = useI18n();
  const {
    setIsMenuOpen,
    setIsBasketOpen,
    setIsWishOpen,
    setIsSearchOpen,
  } = useAppContext();
  const { count: cartCount } = useBasket();
  const { count: wishCount } = useWishlist();

  const nav = [
    { href: sitePath("catalog"), label: t.nav.catalog },
    { href: sitePath("catalog?category=hair"), label: "Волосся" },
    { href: sitePath("catalog?category=face"), label: "Обличчя" },
    { href: sitePath("catalog?category=body"), label: "Тіло" },
    { href: sitePath("about"), label: t.nav.about },
  ];

  function openSearch() {
    setIsSearchOpen(true);
    setIsBasketOpen(false);
    setIsWishOpen(false);
    setIsMenuOpen(false);
  }

  return (
    <div className="site-bar" id="site-bar">
      <header className="site-header">
        <Link href={sitePath()} className="site-logo" aria-label={SITE_NAME}>
          <Image
            className="hdr-logo-img"
            src={MEDIA.logo}
            alt={SITE_NAME}
            width={58}
            height={58}
            priority
            sizes="58px"
          />
        </Link>

        <div className="site-left">
          <nav className="site-nav" aria-label="Main">
            {nav.map((item) => (
              <Link key={item.label + item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="site-icons">
          <button
            type="button"
            className="icon-btn site-search"
            aria-label={t.a11y.search}
            onClick={openSearch}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="hdr-icon hdr-icon--dark"
              src={MEDIA.icons.search}
              width={26}
              height={26}
              alt=""
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="hdr-icon hdr-icon--light"
              src={MEDIA.icons.searchLight}
              width={26}
              height={26}
              alt=""
            />
          </button>

          <Link
            href={sitePath("wishlist")}
            className="icon-btn icon-btn--wish"
            aria-label={t.a11y.wishlist}
            onClick={() => {
              setIsBasketOpen(false);
              setIsWishOpen(false);
              setIsSearchOpen(false);
              setIsMenuOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 20.2l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.38L12 20.2z" />
            </svg>
            {wishCount > 0 && <span className="icon-badge">{wishCount}</span>}
          </Link>
          <button
            type="button"
            className="icon-btn"
            aria-label={t.a11y.cart}
            onClick={() => {
              setIsBasketOpen(true);
              setIsWishOpen(false);
              setIsSearchOpen(false);
              setIsMenuOpen(false);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="hdr-icon hdr-icon--dark"
              src={MEDIA.icons.basket}
              width={26}
              height={26}
              alt=""
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="hdr-icon hdr-icon--light"
              src={MEDIA.icons.basketLight}
              width={26}
              height={26}
              alt=""
            />
            {cartCount > 0 && <span className="icon-badge">{cartCount}</span>}
          </button>
          <button
            type="button"
            className="site-burger icon-btn"
            aria-label={t.a11y.menu}
            onClick={() => {
              setIsMenuOpen(true);
              setIsBasketOpen(false);
              setIsWishOpen(false);
              setIsSearchOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </header>
    </div>
  );
}
