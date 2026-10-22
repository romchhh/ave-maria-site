export const SITE_NAME = "Ave Maria Beauty Lab";
export const SITE_PHONE = "+380988880105";
export const SITE_PHONE_DISPLAY = "+38098 888 0105";
export const SITE_EMAIL = "hello@avemariabeautylab.com";
export const SITE_INSTAGRAM = "https://www.instagram.com/ave.maria_beautylab/";
export const SITE_INSTAGRAM_HANDLE = "@ave.maria_beautylab";

export const SITE_STUDIO_NAME = "Ave Maria Private Studio";
export const SITE_ADDRESS_LINES = [
  "Київ, Дніпровська Набережна 18А",
  "Ave Maria Private Studio",
] as const;

/** Locked address shown at checkout for pickup orders. */
export const SITE_PICKUP_ADDRESS =
  "Ave Maria Private Studio · Київ, Дніпровська Набережна 18А";

export const SITE_MAP_COORDS = { lat: 50.4185, lng: 30.5985 } as const;

export const SITE_MAP_EMBED =
  `https://maps.google.com/maps?q=${encodeURIComponent(
    "Київ, Дніпровська Набережна 18А"
  )}&hl=uk&z=16&output=embed`;

export const SITE_MAP_LINK =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("Київ, Дніпровська Набережна 18А");
