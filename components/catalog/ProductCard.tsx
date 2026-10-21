"use client";

import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";
import type { Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatCardPrice } from "@/lib/format";
import { MEDIA } from "@/lib/media";
import { useAppContext } from "@/lib/GeneralProvider";
import { useBasket } from "@/lib/BasketProvider";
import { useWishlist } from "@/lib/WishlistProvider";
import { productName, type Product } from "@/lib/types";

export default function ProductCard({
  product,
  lang,
  priority = false,
}: {
  product: Product;
  lang: Locale;
  priority?: boolean;
}) {
  const { t } = useI18n();
  const { addItem } = useBasket();
  const { setIsBasketOpen } = useAppContext();
  const { isWished, toggleWish } = useWishlist();
  const wished = isWished(product.id);
  const src = product.images[0] || MEDIA.hero;
  const title = productName(product, lang);
  const href = `/${lang}/product/${product.id}`;
  const onSale =
    product.isSale ||
    (product.compareAtPriceNum != null &&
      product.compareAtPriceNum > product.priceNum);
  const defaultSize =
    product.sizeOptions?.[0] || product.sizes?.split(/[·,]/)[0]?.trim() || "—";

  function addToCart(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: title,
      price: product.price,
      priceNum: product.priceNum,
      size: defaultSize,
      quantity: 1,
      image: src,
    });
    setIsBasketOpen(true);
  }

  return (
    <article className="product">
      <div className="product-img">
        <Link href={href} className="product-img-link" tabIndex={-1} aria-hidden>
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw"
            quality={80}
            priority={priority}
            style={{ objectFit: "contain", objectPosition: "center" }}
          />
        </Link>
        {(product.isNew || onSale || product.isPopular) && (
          <div className="product-badges">
            {product.isNew && <span className="product-badge">New</span>}
            {onSale && <span className="product-badge is-sale">Sale</span>}
            {product.isPopular && (
              <span className="product-badge">Popular</span>
            )}
          </div>
        )}
        <button
          className={`wish${wished ? " is-on" : ""}`}
          type="button"
          aria-label={t.a11y.wishAdd}
          aria-pressed={wished}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWish({
              id: product.id,
              name: title,
              price: product.price,
              priceNum: product.priceNum,
              image: src,
            });
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20.2l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.38L12 20.2z" />
          </svg>
        </button>
      </div>
      <Link href={href} className="product-link">
        <div className="product-info">
          <div className="product-name">{title}</div>
          <div className="product-price">
            {onSale && product.compareAtPriceNum != null && (
              <span className="product-price-old">
                {product.compareAtPriceNum.toLocaleString("uk-UA")} грн
              </span>
            )}
            <span>{formatCardPrice(product)}</span>
          </div>
        </div>
      </Link>
      <button
        className="product-cart"
        type="button"
        onClick={addToCart}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6.5 9.5h11l-.85 9.35A1.5 1.5 0 0 1 15.16 20.5H8.84a1.5 1.5 0 0 1-1.49-1.65L6.5 9.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M9 9.5V8.2A3 3 0 0 1 12 5.2a3 3 0 0 1 3 3v1.3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span>{t.product.cardAdd}</span>
      </button>
    </article>
  );
}
