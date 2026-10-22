/** @deprecated Локалізацію прибрано — сайт лише українською. */
export const SITE_LANGUAGE = "uk" as const;

const LEGACY_PREFIXES = new Set(["uk", "en"]);

/** Чи це застарілий префікс /uk або /en у URL (для редіректу). */
export function isLegacyLocalePrefix(segment: string): boolean {
  return LEGACY_PREFIXES.has(segment);
}
