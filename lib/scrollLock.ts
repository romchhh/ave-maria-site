type ScrollLockSnapshot = {
  bodyOverflow: string;
  bodyPaddingRight: string;
  bodyPosition: string;
  bodyTop: string;
  bodyWidth: string;
  htmlOverflow: string;
  scrollY: number;
};

let lockCount = 0;
let snapshot: ScrollLockSnapshot | null = null;

/** Блокує скрол сторінки (підтримує кілька одночасних оверлеїв). */
export function lockBodyScroll(): void {
  if (typeof document === "undefined") return;
  if (lockCount++ > 0) return;

  const body = document.body;
  const html = document.documentElement;
  const scrollY = window.scrollY;

  snapshot = {
    bodyOverflow: body.style.overflow,
    bodyPaddingRight: body.style.paddingRight,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyWidth: body.style.width,
    htmlOverflow: html.style.overflow,
    scrollY,
  };

  const scrollbarWidth = window.innerWidth - html.clientWidth;

  html.classList.add("scroll-locked");
  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`;
  }
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.width = "100%";
}

export function unlockBodyScroll(): void {
  if (typeof document === "undefined") return;
  if (lockCount <= 0) {
    lockCount = 0;
    return;
  }
  if (--lockCount > 0) return;
  if (!snapshot) return;

  const body = document.body;
  const html = document.documentElement;
  const { scrollY, ...styles } = snapshot;

  html.classList.remove("scroll-locked");
  html.style.overflow = styles.htmlOverflow;
  body.style.overflow = styles.bodyOverflow;
  body.style.paddingRight = styles.bodyPaddingRight;
  body.style.position = styles.bodyPosition;
  body.style.top = styles.bodyTop;
  body.style.width = styles.bodyWidth;

  window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
  snapshot = null;
}
