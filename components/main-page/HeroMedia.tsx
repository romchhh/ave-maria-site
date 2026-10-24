"use client";

import { useEffect, useState } from "react";
import type { HeroFraming } from "@/lib/heroFrame";
import { heroFramingToImgStyle } from "@/lib/heroFrame";

type Props = {
  src: string;
  alt: string;
  frameDesktop: HeroFraming | null;
  frameMobile: HeroFraming | null;
};

const DESKTOP_MQ = "(min-width: 1101px)";

/** Single image request — dual imgs were both fetched in Telegram WebView. */
export default function HeroMedia({
  src,
  alt,
  frameDesktop,
  frameMobile,
}: Props) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const framing = isDesktop ? frameDesktop : frameMobile ?? frameDesktop;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="home-hero__img"
      fetchPriority="high"
      decoding="async"
      draggable={false}
      style={heroFramingToImgStyle(framing)}
    />
  );
}
