/**
 * Публічні URL без префікса /uk (сайт однією мовою).
 * Внутрішні маршрути лишаються app/(site)/[lang]/…
 */
export function sitePath(path = ""): string {
  const trimmed = String(path).replace(/^\//, "");
  return trimmed ? `/${trimmed}` : "/";
}

export function siteUrl(base: string, path = ""): string {
  const root = base.replace(/\/$/, "");
  const p = sitePath(path);
  return p === "/" ? root : `${root}${p}`;
}
