"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";
import { MEDIA } from "@/lib/media";
import { sitePath } from "@/lib/i18n/paths";

const STORAGE_KEY = "ave-intro-seen-v3";
const FADE_MS = 900;
/** Safety only while video is actually playing. */
const MAX_PLAY_MS = 7000;
const MOBILE_MQ = "(max-width: 899px)";

type Variant = {
  src: string;
  poster: string;
};

type Phase = "boot" | "hold" | "playing" | "out" | "done";

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
  const fadedRef = useRef(false);
  const safetyRef = useRef<number | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>("boot");
  const [variant, setVariant] = useState<Variant | null>(null);
  const [needsTap, setNeedsTap] = useState(false);

  const beginFade = () => {
    if (fadedRef.current) return;
    fadedRef.current = true;
    window.clearTimeout(safetyRef.current);
    setNeedsTap(false);
    setPhase("out");
  };

  const armSafety = () => {
    window.clearTimeout(safetyRef.current);
    safetyRef.current = window.setTimeout(beginFade, MAX_PLAY_MS);
  };

  const markPlaying = () => {
    setNeedsTap(false);
    setPhase("playing");
    armSafety();
  };

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

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = next.src;
    link.type = "video/mp4";
    document.head.appendChild(link);

    setPhase("hold");
    return () => {
      link.remove();
    };
  }, [isHome]);

  // Mobile browsers glitch when body is position:fixed under a playing video.
  useEffect(() => {
    const active =
      phase === "hold" || phase === "playing" || phase === "out";
    if (!active) return;

    const mobile = window.matchMedia(MOBILE_MQ).matches;
    if (mobile) {
      const html = document.documentElement;
      const body = document.body;
      const prevHtml = html.style.overflow;
      const prevBody = body.style.overflow;
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      return () => {
        html.style.overflow = prevHtml;
        body.style.overflow = prevBody;
      };
    }

    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [phase]);

  // Wire video events once we have a variant; try muted autoplay.
  useEffect(() => {
    if (phase !== "hold" || !variant) return;
    const video = videoRef.current;
    if (!video) return;

    fadedRef.current = false;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("muted", "");
    video.setAttribute("x5-playsinline", "true");
    video.setAttribute("x5-video-player-type", "h5");
    video.setAttribute("x5-video-player-fullscreen", "false");

    const onEnded = () => beginFade();
    const onError = () => beginFade();
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);

    let started = false;
    const tryAutoplay = () => {
      if (started) return;
      started = true;
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          markPlaying();
        }).catch(() => {
          started = false;
          video.pause();
          setNeedsTap(true);
        });
      } else {
        markPlaying();
      }
    };

    if (video.readyState >= 2) tryAutoplay();
    else video.addEventListener("canplay", tryAutoplay, { once: true });

    return () => {
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
      video.removeEventListener("canplay", tryAutoplay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === "hold", variant]);

  // Keep ended / safety while playing (after tap or successful autoplay).
  useEffect(() => {
    if (phase !== "playing") return;
    const video = videoRef.current;
    if (!video) return;

    const onEnded = () => beginFade();
    const onError = () => beginFade();
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);
    armSafety();

    return () => {
      window.clearTimeout(safetyRef.current);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function onPlayTap() {
    if (!needsTap || phase !== "hold") return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const p = video.play();
    if (p && typeof p.then === "function") {
      p.then(() => {
        markPlaying();
      }).catch(() => {
        setNeedsTap(true);
      });
    } else {
      markPlaying();
    }
  }

  if (phase === "boot" || phase === "done" || !variant) return null;

  return (
    <div
      className={`intro-splash${phase === "out" ? " is-out" : ""}${
        needsTap ? " needs-tap" : ""
      }`}
      role={needsTap ? "dialog" : "presentation"}
      aria-label={needsTap ? "Вступне відео" : undefined}
      aria-hidden={needsTap ? undefined : true}
      onClick={needsTap ? onPlayTap : undefined}
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
      {needsTap && (
        <button
          type="button"
          className="intro-splash-play"
          onClick={(e) => {
            e.stopPropagation();
            onPlayTap();
          }}
          aria-label="Відтворити"
        >
          <span className="intro-splash-play-icon" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
