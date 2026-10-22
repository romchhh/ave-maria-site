"use client";

import type { HeroFraming } from "@/lib/heroFrame";
import { heroFramingToImgStyle } from "@/lib/heroFrame";

type Props = {
  src: string;
  alt: string;
  frameDesktop: HeroFraming | null;
  frameMobile: HeroFraming | null;
};

export default function HeroMedia({
  src,
  alt,
  frameDesktop,
  frameMobile,
}: Props) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="home-hero__img home-hero__img--desktop"
        fetchPriority="high"
        decoding="async"
        draggable={false}
        style={heroFramingToImgStyle(frameDesktop)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="home-hero__img home-hero__img--mobile"
        fetchPriority="high"
        decoding="async"
        draggable={false}
        style={heroFramingToImgStyle(frameMobile ?? frameDesktop)}
      />
    </>
  );
}
