"use client";

import Link from "next/link";
import { useMemo } from "react";
import ProductCard from "@/components/catalog/ProductCard";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { sitePath } from "@/lib/i18n/paths";
import type { Product, WishlistItem } from "@/lib/types";
import { useProducts } from "@/lib/useProducts";
import { useWishlist } from "@/lib/WishlistProvider";

function toProduct(item: WishlistItem): Product {
  return {
    id: item.id,
    name: item.name,
    sizes: "",
    sizeOptions: ["S", "M", "L"],
    price: item.price,
    priceNum: item.priceNum,
    color: "",
    material: "",
    description: "",
    longDescription: "",
    images: [item.image],
    swatches: [],
    inStock: true,
    sku: item.id,
  };
}

export default function WishlistClient() {
  const { t } = useI18n();
  const { items } = useWishlist();
  const { products, loading } = useProducts();

  const wishedProducts = useMemo(() => {
    return items.map((item) => {
      const full = products.find((p) => p.id === item.id);
      return full ?? toProduct(item);
    });
  }, [items, products]);

  const countLabel =
    items.length === 1
      ? "річ"
      : items.length < 5
        ? "речі"
        : "речей";

  return (
    <section className="wish-page">
      <header className="wish-head">
        <h1 className="wish-title">{t.wish.title}</h1>
        {items.length > 0 && (
          <p className="wish-count">
            {items.length} {countLabel}
          </p>
        )}
        <p className="wish-lead">{t.wish.lead}</p>
      </header>

      {loading && !wishedProducts.length ? (
        <p className="wish-empty-text">Завантаження…</p>
      ) : !items.length ? (
        <div className="wish-empty">
          <p className="wish-empty-text">{t.wish.empty}</p>
          <Link href={sitePath("catalog")} className="btn-brand checkout-cta">
            {t.wish.emptyCta}
          </Link>
        </div>
      ) : (
        <div className="products wish-grid">
          {wishedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
