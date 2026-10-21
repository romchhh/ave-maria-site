export const SITE_NAME = "Ave Maria Beauty Lab";
export const SITE_PHONE = "+380000000000";
export const SITE_PHONE_DISPLAY = "@ave.maria_beautylab";
export const SITE_EMAIL = "hello@avemariabeautylab.com";
export const SITE_INSTAGRAM = "https://www.instagram.com/ave.maria_beautylab/";
export const SITE_INSTAGRAM_HANDLE = "@ave.maria_beautylab";
export const SITE_ADDRESS_LINES = [
  "Україна",
  "Ave Maria Beauty Lab",
  "Мультибрендовий магазин косметики",
] as const;

/** Placeholder — update when store address is confirmed. */
export const SITE_MAP_COORDS = { lat: 50.4501, lng: 30.5234 } as const;

export const SITE_MAP_EMBED =
  `https://maps.google.com/maps?q=${SITE_MAP_COORDS.lat},${SITE_MAP_COORDS.lng}&hl=uk&z=14&output=embed`;

export const SITE_MAP_LINK =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("Київ, Україна");
