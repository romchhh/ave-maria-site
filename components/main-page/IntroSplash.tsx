"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useScrollLock } from "@/hooks/useScrollLock";
import { MEDIA } from "@/lib/media";
import { sitePath } from "@/lib/i18n/paths";

const STORAGE_KEY = "ave-intro-seen";
/** Play a few seconds, then dissolve into the site. */
const INTRO_MS = 3400;
const FADE_MS = 900;

export default function IntroSplash() {
  const pathname = usePathname();
  const isHome = pathname === sitePath() || pathname === "/";
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [phase, setPhase] = useState<"boot" | "play" | "out" | "done">(
    "boot"
  );

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
    setPhase("play");
  }, [isHome]);

  useScrollLock(phase === "play" || phase === "out");

  useEffect(() => {
    if (phase !== "play") return;
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      const play = video.play();
      if (play && typeof play.catch === "function") {
        play.catch(() => {
          /* autoplay blocked — still dissolve on timer */
        });
      }
    }

    const fadeTimer = window.setTimeout(() => setPhase("out"), INTRO_MS);
    return () => window.clearTimeout(fadeTimer);
  }, [phase]);

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

  function skip() {
    if (phase !== "play" && phase !== "out") return;
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setPhase("out");
  }

  if (phase === "boot" || phase === "done") return null;

  return (
    <div
      className={`intro-splash${phase === "out" ? " is-out" : ""}`}
      role="dialog"
      aria-label="Intro"
      aria-modal="true"
      onClick={skip}
    >
      <video
        ref={videoRef}
        className="intro-splash-video"
        src={MEDIA.introVideo}
        poster={MEDIA.introPoster}
        muted
        playsInline
        autoPlay
        preload="auto"
        aria-hidden="true"
      />
      <button
        type="button"
        className="intro-splash-skip"
        onClick={(e) => {
          e.stopPropagation();
          skip();
        }}
      >
        Пропустити
      </button>
    </div>
  );
}
