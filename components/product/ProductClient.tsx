"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ProductCard from "@/components/catalog/ProductCard";
import ProductGallery from "@/components/product/ProductGallery";
import { useAppContext } from "@/lib/GeneralProvider";
import { useBasket } from "@/lib/BasketProvider";
import { useWishlist } from "@/lib/WishlistProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import FreeShippingBar from "@/components/shared/FreeShippingBar";
import { formatCardPrice } from "@/lib/format";
import {
  productDescription,
  productName,
  type Product,
} from "@/lib/types";

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  return (
    <div className={`pdp-acc${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="pdp-acc-btn"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        <span className="pdp-acc-icon" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      <div id={panelId} className="pdp-acc-panel" hidden={!open}>
        {children}
      </div>
    </div>
  );
}

function IconTruck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 7.5h11.5V16H3V7.5z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M14.5 10.5H19l2 3V16h-6.5v-5.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M1 9.5h2M1 12h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s6-5.2 6-10.2A6 6 0 0012 4.8a6 6 0 00-6 6C6 15.8 12 21 12 21z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="10.8" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconGift({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="4"
        y="10"
        width="16"
        height="10"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M12 10v10M4 14h16" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 10c-2.2 0-4-1.3-4-3s1.8-2.2 4-.8c2.2-1.4 4-.7 4 .8s-1.8 3-4 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconReturn({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 12a7.5 7.5 0 0113.2-4.9M19.5 12A7.5 7.5 0 016.3 16.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M17 4.5V8h3.5M7 19.5V16H3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PAY_ICONS = [
  { label: "Apple Pay", src: "/assets/icons/pay/apple-pay.svg" },
  { label: "Google Pay", src: "/assets/icons/pay/google-pay.svg" },
  { label: "VISA", src: "/assets/icons/pay/visa.svg" },
  { label: "Mastercard", src: "/assets/icons/pay/mastercard.svg" },
] as const;

function PayBadge({ label, src }: { label: string; src: string }) {
  return (
    <span className="pdp-pay-badge">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} width={120} height={80} loading="lazy" />
    </span>
  );
}

export default function ProductClient({
  product,
  related,
  lang,
}: {
  product: Product;
  related: Product[];
  lang: Locale;
}) {
  const { t } = useI18n();
  const { addItem } = useBasket();
  const { isWished, toggleWish } = useWishlist();
  const {
    setIsBasketOpen,
    isBasketOpen,
    isWishOpen,
    isSearchOpen,
    isMenuOpen,
  } = useAppContext();
  const sizeOptions = product.sizeOptions?.length
    ? product.sizeOptions
    : ["30 мл"];
  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizeOptions.length === 1 ? sizeOptions[0] : null
  );
  const [sizeHint, setSizeHint] = useState(false);
  const [footerInView, setFooterInView] = useState(false);
  const sizeBlockRef = useRef<HTMLDivElement>(null);

  const panelsOpen =
    isBasketOpen || isWishOpen || isSearchOpen || isMenuOpen;
  const hideMobileBar = panelsOpen || footerInView;

  const wished = isWished(product.id);
  const displayName = productName(product, lang);
  const displayDesc = productDescription(product, lang);
  const images = product.images;
  const notes = product.notes || "";
  const activeIngredients =
    product.activeIngredients ||
    product.characteristics ||
    product.modelParams ||
    "";
  const usage = product.usage || "";
  const composition = product.material || "";
  const onSale =
    product.isSale ||
    (product.compareAtPriceNum != null &&
      product.compareAtPriceNum > product.priceNum);

  useEffect(() => {
    if (!sizeHint) return;
    const id = window.setTimeout(() => setSizeHint(false), 4000);
    return () => window.clearTimeout(id);
  }, [sizeHint]);

  useEffect(() => {
    const footer = document.querySelector(".site-foot");
    if (!footer) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setFooterInView(entry.isIntersecting);
      },
      { root: null, threshold: 0, rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  function selectSize(sz: string) {
    setSelectedSize(sz);
    setSizeHint(false);
  }

  function addToCart() {
    if (!selectedSize) {
      setSizeHint(true);
      sizeBlockRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    addItem({
      id: product.id,
      name: displayName,
      price: product.price,
      priceNum: product.priceNum,
      size: selectedSize,
      quantity: 1,
      image: images[0],
    });
    setIsBasketOpen(true);
  }

  return (
    <>
      <div className="pdp">
        <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
          <Link href={`/${lang}`}>{t.product.home}</Link>
          <span aria-hidden="true">›</span>
          <Link href={`/${lang}/catalog`}>{t.product.catalog}</Link>
          <span aria-hidden="true">›</span>
          <span>{displayName}</span>
        </nav>

        <div className="pdp-layout">
          <div className="pdp-media">
            <ProductGallery
              images={images}
              alt={displayName}
              prevLabel={t.a11y.prevPhoto}
              nextLabel={t.a11y.nextPhoto}
              closeLabel={t.a11y.close}
            />
          </div>

          <div className="pdp-info">
            <header className="pdp-intro">
              <h1 className="pdp-title">{displayName}</h1>
              <div className="pdp-price">
                {onSale && product.compareAtPriceNum != null && (
                  <span className="pdp-price-old">
                    {product.compareAtPriceNum.toLocaleString("uk-UA")} грн
                  </span>
                )}
                <span>{formatCardPrice(product)}</span>
              </div>
            </header>

            <div
              className={`pdp-block pdp-size-block${sizeHint ? " is-hint" : ""}`}
              ref={sizeBlockRef}
            >
              <div className="pdp-size-head">
                <p className="pdp-label">{t.product.size}</p>
              </div>
              <div
                className="pdp-sizes"
                role="listbox"
                aria-label={t.product.size}
                aria-invalid={sizeHint}
              >
                {sizeOptions.map((sz) => (
                  <button
                    key={sz}
                    className={`pdp-size${selectedSize === sz ? " is-active" : ""}`}
                    type="button"
                    role="option"
                    aria-selected={selectedSize === sz}
                    onClick={() => selectSize(sz)}
                  >
                    {sz}
                  </button>
                ))}
              </div>
              {sizeHint && (
                <p className="pdp-inline-hint" role="status">
                  {t.product.pickSize}
                </p>
              )}
            </div>

            <div className="pdp-actions">
              <button
                className="pdp-cart pdp-cart--desktop"
                type="button"
                onClick={addToCart}
              >
                {t.product.addToCart}
              </button>
              <button
                className={`pdp-wishlist-link${wished ? " is-on" : ""}`}
                type="button"
                aria-pressed={wished}
                onClick={() =>
                  toggleWish({
                    id: product.id,
                    name: displayName,
                    price: product.price,
                    priceNum: product.priceNum,
                    image: images[0],
                  })
                }
              >
                {wished ? t.product.inWish : t.product.addWish}
              </button>
            </div>
          </div>
        </div>

        <section className="pdp-details" aria-label="Деталі та сервіс">
          <FreeShippingBar className="free-ship--pdp" />

          <div className="pdp-perks">
            <div className="pdp-perks-grid">
              <div className="pdp-perk">
                <IconTruck className="pdp-perk-icon" />
                <span>Швидка доставка 1–2 дні</span>
              </div>
              <Link href={`/${lang}/contacts`} className="pdp-perk pdp-perk--link">
                <IconPin className="pdp-perk-icon" />
                <span>Наявність в магазинах</span>
                <span className="pdp-perk-chevron" aria-hidden>
                  ›
                </span>
              </Link>
              <div className="pdp-perk">
                <IconGift className="pdp-perk-icon" />
                <span>Подаруночки до покупки</span>
              </div>
              <div className="pdp-perk">
                <IconReturn className="pdp-perk-icon" />
                <span>14 днів — повернення товару</span>
              </div>
            </div>
            <div className="pdp-pay" aria-label="Способи оплати">
              <p className="pdp-pay-label">Оплата</p>
              <div className="pdp-pay-row">
                {PAY_ICONS.map((pay) => (
                  <PayBadge key={pay.label} label={pay.label} src={pay.src} />
                ))}
              </div>
            </div>
          </div>

          <div className="pdp-acc-list">
            {displayDesc && (
              <Accordion title="Опис" defaultOpen>
                <p className="pdp-desc">{displayDesc}</p>
              </Accordion>
            )}
            {notes && (
              <Accordion title="Ноти">
                <p className="pdp-desc">{notes}</p>
              </Accordion>
            )}
            {activeIngredients && (
              <Accordion title="Активні інгредієнти">
                <p className="pdp-desc" style={{ whiteSpace: "pre-line" }}>
                  {activeIngredients}
                </p>
              </Accordion>
            )}
            {usage && (
              <Accordion title="Спосіб застосування">
                <p className="pdp-desc" style={{ whiteSpace: "pre-line" }}>
                  {usage}
                </p>
              </Accordion>
            )}
            {composition && (
              <Accordion title="Склад">
                <p className="pdp-desc" style={{ whiteSpace: "pre-line" }}>
                  {composition}
                </p>
              </Accordion>
            )}
          </div>
        </section>

        <div className="pdp-below">
          {related.length > 0 && (
            <section className="pdp-related" aria-label={t.product.lookTitle}>
              <div className="pdp-related-head">
                <h2 className="pdp-section-title">{t.product.lookTitle}</h2>
              </div>
              <div className="pdp-related-grid">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} lang={lang} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <div
        className={`pdp-mobile-bar${hideMobileBar ? " is-hidden" : ""}`}
        aria-hidden={hideMobileBar}
      >
        <button
          className="pdp-cart"
          type="button"
          onClick={addToCart}
          tabIndex={hideMobileBar ? -1 : undefined}
        >
          {t.product.addToCart}
        </button>
      </div>
    </>
  );
}
