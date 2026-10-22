/** Canonical public media paths — keep folders under /public/assets grouped. */
export const MEDIA = {
  logo: "/assets/brand/logo.webp",
  hero: "/assets/hero/hero.webp",
  /** Still life — блок «Про нас» на головній */
  aboutStillLife: "/assets/hero/about-still-life.webp",
  /** Hero на сторінці /about */
  aboutHero: "/assets/hero/about-hero.webp",
  brushPink: "/assets/decor/brush-pink.webp",
  footerWaves: "/assets/decor/footer-liquid-waves.png",
  icons: {
    search: "/assets/icons/search.svg",
    searchLight: "/assets/icons/search-light.svg",
    basket: "/assets/icons/basket.svg",
    basketLight: "/assets/icons/basket-light.svg",
  },
} as const;
