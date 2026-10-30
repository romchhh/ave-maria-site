"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useScrollLock } from "@/hooks/useScrollLock";
import { MEDIA } from "@/lib/media";
import { sitePath } from "@/lib/i18n/paths";

const STORAGE_KEY = "ave-intro-seen-v3";
const FADE_MS = 900;
/** Safety net if autoplay/ended never fires. */
const MAX_INTRO_MS = 5600;
const MOBILE_MQ = "(max-width: 899px)";

type Variant = {
  src: string;
  poster: string;
};

function pickVariant(): Variant {
  if (typeof window === "undefined") {
    return { src: MEDIA.introDesktop, poster: MEDIA.introDesktopPoster };
  }
  const mobile = window.matchMedia(MOBILE_MQ).matches;
  return mobile
    ? { src: MEDIA.introMobile, poster: MEDIA.introMobilePoster }
    : { src: MEDIA.introDesktop, poster: MEDIA.introDesktopPoster };
}

export default function IntroSplash() {
  const pathname = usePathname();
  const isHome = pathname === sitePath() || pathname === "/";
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [phase, setPhase] = useState<"boot" | "play" | "out" | "done">(
    "boot"
  );
  const [variant, setVariant] = useState<Variant | null>(null);

  useEffect(() => {
    if (!isHome) {
      setPhase("done");
      return;
    }
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    try {
      if (reduced || sessionStorage.getItem(STORAGE_KEY) === "1") {
        setPhase("done");
        return;
      }
    } catch {
      /* private mode */
    }

    const next = pickVariant();
    setVariant(next);

    // Preload only the variant we will play.
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = next.src;
    link.type = "video/mp4";
    document.head.appendChild(link);

    setPhase("play");
    return () => {
      link.remove();
    };
  }, [isHome]);

  useScrollLock(phase === "play" || phase === "out");

  useEffect(() => {
    if (phase !== "play" || !variant) return;
    const video = videoRef.current;
    if (!video) return;

    let faded = false;
    const beginFade = () => {
      if (faded) return;
      faded = true;
      setPhase("out");
    };

    const onEnded = () => beginFade();
    const onError = () => beginFade();

    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);

    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          /* still wait for ended / safety timer */
        });
      }
    };

    if (video.readyState >= 2) tryPlay();
    else video.addEventListener("loadeddata", tryPlay, { once: true });

    const safety = window.setTimeout(beginFade, MAX_INTRO_MS);
    return () => {
      window.clearTimeout(safety);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
      video.removeEventListener("loadeddata", tryPlay);
    };
  }, [phase, variant]);

  useEffect(() => {
    if (phase !== "out") return;
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    const doneTimer = window.setTimeout(() => setPhase("done"), FADE_MS);
    return () => window.clearTimeout(doneTimer);
  }, [phase]);

  if (phase === "boot" || phase === "done" || !variant) return null;

  return (
    <div
      className={`intro-splash${phase === "out" ? " is-out" : ""}`}
      role="presentation"
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        className="intro-splash-video"
        src={variant.src}
        poster={variant.poster}
        muted
        playsInline
        autoPlay
        preload="auto"
        disablePictureInPicture
        controls={false}
      />
    </div>
  );
}
