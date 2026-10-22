"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Category } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";

const LOOP_COPIES = 3;

export default function CategoriesCarousel({
  lang,
  categories,
}: {
  lang: Locale;
  categories: Category[];
}) {
  const { t } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const jumpingRef = useRef(false);
  const [activeDomIndex, setActiveDomIndex] = useState(0);
  const [ready, setReady] = useState(false);

  const items = useMemo(
    () =>
      Array.from({ length: LOOP_COPIES }, (_, copy) =>
        categories.map((cat) => ({ cat, copy, key: `${cat.id}-${copy}` }))
      ).flat(),
    [categories]
  );

  const midStart = categories.length;

  const centerOnCard = useCallback((card: HTMLElement, smooth = false) => {
    const el = trackRef.current;
    if (!el) return;
    const trackRect = el.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const delta =
      cardRect.left + cardRect.width / 2 - (trackRect.left + trackRect.width / 2);
    if (Math.abs(delta) < 1) return;
    if (smooth) {
      el.scrollBy({ left: delta, behavior: "smooth" });
    } else {
      el.scrollLeft += delta;
    }
  }, []);

  const syncLoop = useCallback(() => {
    const el = trackRef.current;
    if (!el || !categories.length || jumpingRef.current) return;

    const cards = el.querySelectorAll<HTMLElement>(".cat-card");
    if (!cards.length) return;

    const trackRect = el.getBoundingClientRect();
    const centerX = trackRect.left + trackRect.width / 2;
    let best = 0;
    let bestDist = Infinity;

    cards.forEach((card, i) => {
      const r = card.getBoundingClientRect();
      const dist = Math.abs(r.left + r.width / 2 - centerX);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });

    setActiveDomIndex(best);

    const n = categories.length;
    if (n === 0) return;

    let jumpTo = best;
    if (best < n) jumpTo = best + n;
    else if (best >= n * 2) jumpTo = best - n;
    else return;

    const target = cards[jumpTo];
    if (!target) return;

    jumpingRef.current = true;
    centerOnCard(target, false);
    setActiveDomIndex(jumpTo);
    requestAnimationFrame(() => {
      jumpingRef.current = false;
    });
  }, [categories.length, centerOnCard]);

  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el || !categories.length) return;

    const cards = el.querySelectorAll<HTMLElement>(".cat-card");
    const start = cards[midStart];
    if (!start) return;

    centerOnCard(start, false);
    setActiveDomIndex(midStart);
    setReady(true);
  }, [categories.length, midStart, centerOnCard]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !ready) return;

    const onScroll = () => syncLoop();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [syncLoop, ready]);

  function scrollBy(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el || !categories.length) return;
    const cards = el.querySelectorAll<HTMLElement>(".cat-card");
    const n = categories.length;
    let from = activeDomIndex;

    // Stay in the middle copy so smooth scroll never crosses a hard edge.
    if (from < n && cards[from + n]) {
      jumpingRef.current = true;
      centerOnCard(cards[from + n], false);
      from += n;
      setActiveDomIndex(from);
      jumpingRef.current = false;
    } else if (from >= n * 2 && cards[from - n]) {
      jumpingRef.current = true;
      centerOnCard(cards[from - n], false);
      from -= n;
      setActiveDomIndex(from);
      jumpingRef.current = false;
    }

    const next = from + dir;
    const target = cards[next];
    if (!target) return;
    centerOnCard(target, true);
  }

  if (!categories.length) return null;

  return (
    <section className="home-section home-cats" aria-labelledby="cats-title">
      <div className="section-head">
        <h2 id="cats-title">{t.home.categories}</h2>
        <div className="cat-nav">
          <button
            type="button"
            aria-label={lang === "uk" ? "Назад" : "Previous"}
            onClick={() => scrollBy(-1)}
          >
            <svg viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={lang === "uk" ? "Далі" : "Next"}
            onClick={() => scrollBy(1)}
          >
            <svg viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`cat-track${ready ? " is-ready" : ""}`}
        ref={trackRef}
      >
        {items.map(({ cat, key }, i) => (
          <Link
            key={key}
            href={
              cat.id === "all"
                ? `/${lang}/catalog`
                : `/${lang}/catalog?category=${cat.id}`
            }
            className={`cat-card${i === activeDomIndex ? " is-center" : ""}`}
          >
            <Image
              src={cat.image}
              alt={cat.label.uk}
              fill
              sizes="(max-width: 699px) 72vw, 320px"
              quality={85}
              style={{ objectFit: "cover", objectPosition: "center center" }}
            />
            <div className="cat-card-shade" />
            <div className="cat-card-copy">
              <strong>{cat.label.uk}</strong>
              <span>{cat.cta.uk}</span>
            </div>
          </Link>
        ))}
      </div>

      <p className="cat-scroll-hint is-visible" aria-hidden="false">
        <span>{t.home.categoriesScroll}</span>
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M9 5l7 7-7 7" />
        </svg>
      </p>
    </section>
  );
}
