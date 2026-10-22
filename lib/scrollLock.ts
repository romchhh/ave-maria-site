type ScrollLockSnapshot = {
  bodyOverflow: string;
  bodyPaddingRight: string;
  bodyPosition: string;
  bodyTop: string;
  bodyWidth: string;
  htmlOverflow: string;
  htmlScrollBehavior: string;
  scrollY: number;
};

let lockCount = 0;
let snapshot: ScrollLockSnapshot | null = null;

function scrollWindowInstant(y: number): void {
  const left = window.scrollX;
  document.documentElement.scrollTop = y;
  document.body.scrollTop = y;
  try {
    window.scrollTo({ left, top: y, behavior: "instant" });
  } catch {
    window.scrollTo(left, y);
  }
}

/** Блокує скрол сторінки (підтримує кілька одночасних оверлеїв). */
export function lockBodyScroll(): void {
  if (typeof document === "undefined") return;
  if (lockCount++ > 0) return;

  const body = document.body;
  const html = document.documentElement;
  const scrollY = window.scrollY || html.scrollTop;

  snapshot = {
    bodyOverflow: body.style.overflow,
    bodyPaddingRight: body.style.paddingRight,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyWidth: body.style.width,
    htmlOverflow: html.style.overflow,
    htmlScrollBehavior: html.style.scrollBehavior,
    scrollY,
  };

  const scrollbarWidth = window.innerWidth - html.clientWidth;

  html.classList.add("scroll-locked");
  html.style.scrollBehavior = "auto";
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
  const { scrollY: savedY, htmlScrollBehavior, ...styles } = snapshot;

  const topPx = parseInt(body.style.top || "0", 10);
  const scrollY = topPx < 0 ? -topPx : savedY;

  html.classList.remove("scroll-locked");
  html.style.overflow = styles.htmlOverflow;
  body.style.overflow = styles.bodyOverflow;
  body.style.paddingRight = styles.bodyPaddingRight;
  body.style.position = styles.bodyPosition;
  body.style.top = styles.bodyTop;
  body.style.width = styles.bodyWidth;
  html.style.scrollBehavior = "auto";

  scrollWindowInstant(scrollY);

  html.style.scrollBehavior = htmlScrollBehavior;
  snapshot = null;
}
