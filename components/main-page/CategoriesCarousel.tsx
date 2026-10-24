"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Category } from "@/lib/categories";
import { sitePath } from "@/lib/i18n/paths";
import { withMediaCacheBust } from "@/lib/mediaUrl";
import { useI18n } from "@/lib/i18n/I18nProvider";

const LOOP_COPIES = 3;

export default function CategoriesCarousel({
  categories,
}: {
  categories: Category[];
}) {
  const { t } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const jumpingRef = useRef(false);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeDomIndex, setActiveDomIndex] = useState(0);
  const [loopJumping, setLoopJumping] = useState(false);
  const [ready, setReady] = useState(false); // loop init done — not used for paint gating

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

  const findCenteredIndex = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 0;
    const cards = el.querySelectorAll<HTMLElement>(".cat-card");
    if (!cards.length) return 0;

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
    return best;
  }, []);

  const repositionLoop = useCallback(() => {
    const el = trackRef.current;
    if (!el || !categories.length || jumpingRef.current) return;

    const cards = el.querySelectorAll<HTMLElement>(".cat-card");
    const n = categories.length;
    if (!cards.length || n === 0) return;

    const best = findCenteredIndex();

    if (best >= n && best < n * 2) {
      setActiveDomIndex(best);
      return;
    }

    const jumpTo = best < n ? best + n : best - n;
    const target = cards[jumpTo];
    if (!target) return;

    jumpingRef.current = true;
    setLoopJumping(true);
    setActiveDomIndex(jumpTo);
    centerOnCard(target, false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        jumpingRef.current = false;
        setLoopJumping(false);
      });
    });
  }, [categories.length, centerOnCard, findCenteredIndex]);

  const logicalCenterIndex = useCallback(
    (domIndex: number) => {
      const n = categories.length;
      if (n === 0) return domIndex;
      if (domIndex < n) return domIndex + n;
      if (domIndex >= n * 2) return domIndex - n;
      return domIndex;
    },
    [categories.length]
  );

  const onTrackScroll = useCallback(() => {
    if (jumpingRef.current) return;

    const n = categories.length;
    if (!n) return;

    const best = findCenteredIndex();
    setActiveDomIndex(logicalCenterIndex(best));

    if (scrollEndTimerRef.current) {
      clearTimeout(scrollEndTimerRef.current);
    }
    scrollEndTimerRef.current = setTimeout(() => {
      repositionLoop();
    }, 120);
  }, [categories.length, findCenteredIndex, logicalCenterIndex, repositionLoop]);

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

    const onScrollEnd = () => repositionLoop();
    el.addEventListener("scroll", onTrackScroll, { passive: true });
    el.addEventListener("scrollend", onScrollEnd);
    window.addEventListener("resize", repositionLoop);
    return () => {
      el.removeEventListener("scroll", onTrackScroll);
      el.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("resize", repositionLoop);
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    };
  }, [onTrackScroll, repositionLoop, ready]);

  function scrollBy(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el || !categories.length) return;
    const cards = el.querySelectorAll<HTMLElement>(".cat-card");
    const n = categories.length;
    let from = activeDomIndex;

    // Stay in the middle copy so smooth scroll never crosses a hard edge.
    if (from < n && cards[from + n]) {
      jumpingRef.current = true;
      setLoopJumping(true);
      centerOnCard(cards[from + n], false);
      from += n;
      setActiveDomIndex(from);
      requestAnimationFrame(() => {
        jumpingRef.current = false;
        setLoopJumping(false);
      });
    } else if (from >= n * 2 && cards[from - n]) {
      jumpingRef.current = true;
      setLoopJumping(true);
      centerOnCard(cards[from - n], false);
      from -= n;
      setActiveDomIndex(from);
      requestAnimationFrame(() => {
        jumpingRef.current = false;
        setLoopJumping(false);
      });
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
            aria-label="Назад"
            onClick={() => scrollBy(-1)}
          >
            <svg viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Далі"
            onClick={() => scrollBy(1)}
          >
            <svg viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`cat-track${loopJumping ? " is-jumping" : ""}`}
        ref={trackRef}
      >
        {items.map(({ cat, key }, i) => (
          <Link
            key={key}
            href={
              cat.id === "all"
                ? sitePath("catalog")
                : sitePath(`catalog?category=${cat.id}`)
            }
            className={`cat-card${i === activeDomIndex ? " is-center" : ""}`}
          >
            <Image
              src={withMediaCacheBust(
                cat.image,
                cat.imageVersion || undefined
              )}
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
