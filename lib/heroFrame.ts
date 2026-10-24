import type { CSSProperties } from "react";
import type { NormalizedCrop } from "@/lib/imageCrop";

/** Збережений кадр hero (відносно одного вихідного фото). */
export type HeroFraming = NormalizedCrop & {
  offsetX: number;
  offsetY: number;
  zoom: number;
};

export const HERO_DESKTOP_ASPECT = 3 / 2;
export const HERO_MOBILE_ASPECT = 9 / 16;

export function defaultHeroFraming(): HeroFraming {
  return {
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    offsetX: 0.5,
    offsetY: 0.5,
    zoom: 1,
  };
}

export function parseHeroFraming(raw: string | undefined | null): HeroFraming | null {
  if (!raw?.trim()) return null;
  try {
    const o = JSON.parse(raw) as Partial<HeroFraming>;
    if (
      typeof o.x === "number" &&
      typeof o.y === "number" &&
      typeof o.w === "number" &&
      typeof o.h === "number" &&
      o.w > 0 &&
      o.h > 0
    ) {
      return {
        x: o.x,
        y: o.y,
        w: o.w,
        h: o.h,
        offsetX: typeof o.offsetX === "number" ? o.offsetX : o.x + o.w / 2,
        offsetY: typeof o.offsetY === "number" ? o.offsetY : o.y + o.h / 2,
        zoom: typeof o.zoom === "number" ? o.zoom : 1,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function serializeHeroFraming(f: HeroFraming): string {
  return JSON.stringify(f);
}

/**
 * Display framing without CSS `transform: scale()`.
 * Scale transforms on full-bleed hero images “zoom” while scrolling in
 * Telegram / iOS WebViews when the chrome resizes the viewport.
 */
export function heroFramingToImgStyle(
  framing: HeroFraming | null
): CSSProperties {
  if (!framing) {
    return { objectPosition: "50% 32%" };
  }
  const ox = framing.offsetX;
  const oy = framing.offsetY;
  const zoom = Math.max(1, Math.min(framing.zoom || 1, 3));
  if (zoom <= 1.001) {
    return { objectPosition: `${ox * 100}% ${oy * 100}%` };
  }
  return {
    position: "absolute",
    width: `${zoom * 100}%`,
    height: `${zoom * 100}%`,
    maxWidth: "none",
    left: `${ox * (1 - zoom) * 100}%`,
    top: `${oy * (1 - zoom) * 100}%`,
    objectFit: "cover",
    objectPosition: `${ox * 100}% ${oy * 100}%`,
  };
}

export function buildHeroFraming(
  crop: NormalizedCrop,
  offset: { x: number; y: number },
  zoom: number
): HeroFraming {
  return {
    ...crop,
    offsetX: offset.x,
    offsetY: offset.y,
    zoom,
  };
}
