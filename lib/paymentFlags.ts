/** Client-safe payment flag helpers — no next/cache / DB imports. */

/** Empty / missing = enabled (backward compatible). Explicit "0"/"false"/"off" = off. */
export function isPaymentFlagOn(raw: string | null | undefined): boolean {
  const v = String(raw ?? "").trim().toLowerCase();
  if (!v) return true;
  return !(v === "0" || v === "false" || v === "off" || v === "no");
}

export function flagToSetting(on: boolean): string {
  return on ? "1" : "0";
}
