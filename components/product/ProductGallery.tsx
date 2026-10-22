"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import type { ProductMedia } from "@/lib/types";

export default function ProductGallery({
  media,
  alt,
  prevLabel,
  nextLabel,
  closeLabel = "Close",
}: {
  media: ProductMedia[];
  alt: string;
  prevLabel: string;
  nextLabel: string;
  closeLabel?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lightboxTrackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startScroll: number;
    moved: boolean;
    dragging: boolean;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startScroll: 0,
    moved: false,
    dragging: false,
  });
  const tapItemRef = useRef<HTMLElement | null>(null);
  const skipClickRef = useRef(false);

  const TAP_MOVE_PX = 12;
  const DRAG_SCROLL_PX = 48;

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  useScrollLock(lightboxOpen);

  const count = media.length;

  const getStep = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 0;
    const first = el.querySelector<HTMLElement>(".pdp-gallery-item");
    if (!first) return el.clientWidth;
    const styles = getComputedStyle(el);
    const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
    return first.offsetWidth + gap;
  }, []);

  const syncControls = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    setCanPrev(left > 4);
    setCanNext(left < maxScroll - 4);

    const step = getStep();
    if (step <= 0) {
      setPage(0);
      setPageCount(1);
      return;
    }
    const pages = Math.max(1, Math.round(maxScroll / step) + 1);
    setPageCount(pages);
    setPage(Math.min(pages - 1, Math.round(left / step)));
  }, [getStep]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    syncControls();
    el.addEventListener("scroll", syncControls, { passive: true });
    const ro = new ResizeObserver(syncControls);
    ro.observe(el);
    window.addEventListener("resize", syncControls);
    return () => {
      el.removeEventListener("scroll", syncControls);
      ro.disconnect();
      window.removeEventListener("resize", syncControls);
    };
  }, [media, syncControls]);

  useEffect(() => {
    if (!lightboxOpen) {
      lightboxTrackRef.current
        ?.querySelectorAll("video")
        .forEach((v) => {
          v.pause();
        });
      return;
    }
    const el = lightboxTrackRef.current;
    if (!el) return;
    const slide = el.children[lightboxIndex] as HTMLElement | undefined;
    if (slide) {
      el.scrollTo({ left: slide.offsetLeft, behavior: "auto" });
    }
    const video = slide?.querySelector("video");
    if (video) {
      void video.play().catch(() => undefined);
    }
  }, [lightboxOpen, lightboxIndex]);

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLightboxOpen(false);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setLightboxIndex((i) => Math.max(0, i - 1));
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setLightboxIndex((i) => Math.min(count - 1, i + 1));
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxOpen, count]);

  function scrollByDir(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: getStep() * dir, behavior: "smooth" });
  }

  function goToPage(index: number) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: getStep() * index, behavior: "smooth" });
  }

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
  }

  function lightboxPrev() {
    setLightboxIndex((i) => Math.max(0, i - 1));
  }

  function lightboxNext() {
    setLightboxIndex((i) => Math.min(count - 1, i + 1));
  }

  function onLightboxScroll() {
    const el = lightboxTrackRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / w);
    if (idx !== lightboxIndex && idx >= 0 && idx < count) {
      setLightboxIndex(idx);
    }
  }

  function galleryItemIndex(node: HTMLElement | null) {
    const el = trackRef.current;
    if (!el || !node) return -1;
    const items = Array.from(
      el.querySelectorAll<HTMLElement>(".pdp-gallery-item")
    );
    return items.indexOf(node);
  }

  function openLightboxFromItem(node: HTMLElement | null) {
    const index = galleryItemIndex(node);
    if (index >= 0) openLightbox(index);
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = trackRef.current;
    if (!el) return;
    tapItemRef.current =
      (e.target as HTMLElement | null)?.closest(".pdp-gallery-item") ?? null;
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
      dragging: false,
    };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const el = trackRef.current;
    if (!drag.active || !el || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    if (!drag.dragging && Math.abs(dx) <= TAP_MOVE_PX) return;

    if (!drag.dragging) {
      drag.dragging = true;
      drag.moved = true;
      el.classList.add("is-dragging");
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }

    el.scrollLeft = drag.startScroll - dx;
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const el = trackRef.current;
    if (!drag.active || !el || drag.pointerId !== e.pointerId) return;

    if (drag.dragging) {
      el.classList.remove("is-dragging");
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }

    const dx = e.clientX - drag.startX;
    const wasDrag = drag.dragging;
    drag.active = false;
    drag.pointerId = null;
    drag.dragging = false;

    if (!wasDrag) {
      openLightboxFromItem(tapItemRef.current);
      tapItemRef.current = null;
      return;
    }

    tapItemRef.current = null;
    skipClickRef.current = true;

    if (Math.abs(dx) > DRAG_SCROLL_PX) {
      scrollByDir(dx < 0 ? 1 : -1);
      return;
    }

    const step = getStep();
    if (step > 0) {
      const nearest = Math.round(el.scrollLeft / step);
      el.scrollTo({ left: nearest * step, behavior: "smooth" });
    }
  }

  function activateItem(index: number) {
    if (skipClickRef.current) {
      skipClickRef.current = false;
      return;
    }
    openLightbox(index);
  }

  if (!count) return null;

  const single = count === 1;
  const swipeGallery = count > 1;

  return (
    <>
      <div className={`pdp-slider${single ? " is-single" : ""}`}>
        <div
          className={`pdp-gallery${single ? " is-single" : ""}`}
          ref={trackRef}
          onPointerDown={swipeGallery ? onPointerDown : undefined}
          onPointerMove={swipeGallery ? onPointerMove : undefined}
          onPointerUp={swipeGallery ? endDrag : undefined}
          onPointerCancel={swipeGallery ? endDrag : undefined}
        >
          {media.map((item, i) => (
            <figure
              className={`pdp-gallery-item${item.type === "video" ? " is-video" : ""}`}
              key={`${item.url}-${i}`}
              role="button"
              tabIndex={0}
              aria-label={`${alt} — ${i + 1}`}
              onClick={() => activateItem(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  activateItem(i);
                }
              }}
            >
              {item.type === "video" ? (
                <video
                  className="pdp-gallery-video"
                  src={item.url}
                  muted
                  playsInline
                  loop
                  preload="metadata"
                  draggable={false}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt=""
                  aria-hidden="true"
                  decoding={i === 0 ? "sync" : "async"}
                  loading={i === 0 ? "eager" : "lazy"}
                  draggable={false}
                />
              )}
              {item.type === "video" && (
                <span className="pdp-gallery-play" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M9 7.5v9l7.5-4.5L9 7.5z" fill="currentColor" />
                  </svg>
                </span>
              )}
            </figure>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              className={`pdp-nav pdp-nav--prev${canPrev ? "" : " is-disabled"}`}
              aria-label={prevLabel}
              disabled={!canPrev}
              onClick={() => scrollByDir(-1)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              className={`pdp-nav pdp-nav--next${canNext ? "" : " is-disabled"}`}
              aria-label={nextLabel}
              disabled={!canNext}
              onClick={() => scrollByDir(1)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {pageCount > 1 && (
              <div className="pdp-dots" role="tablist" aria-label="Gallery">
                {Array.from({ length: pageCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`pdp-dot${i === page ? " is-active" : ""}`}
                    aria-label={`${i + 1}`}
                    aria-current={i === page ? "true" : undefined}
                    onClick={() => goToPage(i)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {lightboxOpen && (
        <div
          className="pdp-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <button
            type="button"
            className="pdp-lightbox-backdrop"
            aria-label={closeLabel}
            onClick={closeLightbox}
          />

          <button
            type="button"
            className="pdp-lightbox-close"
            aria-label={closeLabel}
            onClick={closeLightbox}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                className={`pdp-lightbox-nav pdp-lightbox-nav--prev${
                  lightboxIndex === 0 ? " is-disabled" : ""
                }`}
                aria-label={prevLabel}
                disabled={lightboxIndex === 0}
                onClick={lightboxPrev}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                className={`pdp-lightbox-nav pdp-lightbox-nav--next${
                  lightboxIndex >= count - 1 ? " is-disabled" : ""
                }`}
                aria-label={nextLabel}
                disabled={lightboxIndex >= count - 1}
                onClick={lightboxNext}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div
            className="pdp-lightbox-track"
            ref={lightboxTrackRef}
            onScroll={onLightboxScroll}
          >
            {media.map((item, i) => (
              <figure className="pdp-lightbox-slide" key={`lb-${item.url}-${i}`}>
                {item.type === "video" ? (
                  <video
                    className="pdp-lightbox-video"
                    src={item.url}
                    controls
                    playsInline
                    preload="metadata"
                    draggable={false}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={`${alt} — ${i + 1}`}
                    referrerPolicy="no-referrer"
                    draggable={false}
                  />
                )}
              </figure>
            ))}
          </div>

          {count > 1 && (
            <p className="pdp-lightbox-count" aria-live="polite">
              {lightboxIndex + 1} / {count}
            </p>
          )}
        </div>
      )}
    </>
  );
}
