/** Canonical public media paths — keep folders under /public/assets grouped. */
export const MEDIA = {
  logo: "/assets/brand/logo.webp",
  hero: "/assets/hero/hero.webp",
  /** Still life — блок «Про нас» на головній */
  aboutStillLife: "/assets/hero/about-still-life.webp",
  /** Hero на сторінці /about */
  aboutHero: "/assets/hero/about-hero.webp",
  /** Homepage intro splash — device-specific, muted ~4.5s */
  introMobile: "/assets/hero/intro-mobile.mp4",
  introMobilePoster: "/assets/hero/intro-mobile-poster.jpg",
  introDesktop: "/assets/hero/intro-desktop.mp4",
  introDesktopPoster: "/assets/hero/intro-desktop-poster.jpg",
  brushPink: "/assets/decor/brush-pink.webp",
  footerWaves: "/assets/decor/footer-liquid-waves.png",
  icons: {
    search: "/assets/icons/search.svg",
    searchLight: "/assets/icons/search-light.svg",
    basket: "/assets/icons/basket.svg",
    basketLight: "/assets/icons/basket-light.svg",
  },
} as const;
