/** Strip cache-bust / query for stable DB storage. */
export function stripMediaQuery(url: string): string {
  const raw = String(url || "").trim();
  if (!raw) return "";
  const q = raw.indexOf("?");
  return q >= 0 ? raw.slice(0, q) : raw;
}

/** Add or refresh cache-bust so browsers / next/image pick up new files immediately. */
export function withMediaCacheBust(
  url: string,
  version: string | number = Date.now()
): string {
  const base = stripMediaQuery(url);
  if (!base) return "";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}v=${version}`;
}
