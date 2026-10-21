export type { NovaWarehouseKind } from "@/lib/novaPoshtaShared";
import type { NovaWarehouseKind } from "@/lib/novaPoshtaShared";

type NpEnvelope = {
  success?: boolean;
  data?: Array<Record<string, unknown>>;
  errors?: unknown[];
};

async function getApiKey(): Promise<string> {
  // Public address methods work with an empty key; a personal key raises limits.
  const { resolveSetting } = await import("@/lib/settings");
  return resolveSetting("nova_poshta_api_key", [
    process.env.NOVA_POSHTA_API_KEY,
    process.env.NEXT_PUBLIC_NOVA_POSHTA_API_KEY,
  ]);
}

async function callNovaPoshta(
  calledMethod: string,
  methodProperties: Record<string, unknown>
): Promise<NpEnvelope> {
  const res = await fetch("https://api.novaposhta.ua/v2.0/json/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: await getApiKey(),
      modelName: "AddressGeneral",
      calledMethod,
      methodProperties,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`np_http_${res.status}`);
  }

  return (await res.json()) as NpEnvelope;
}

function descriptions(data: NpEnvelope["data"]): string[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => String(row.Description || "").trim())
    .filter(Boolean);
}

function isLockerRow(row: Record<string, unknown>): boolean {
  const category = String(row.CategoryOfWarehouse || "");
  if (/postomat/i.test(category)) return true;
  const desc = String(row.Description || "");
  return /поштомат|postomat|locker/i.test(desc);
}

export async function searchNovaCities(query: string): Promise<string[]> {
  const envelope = await callNovaPoshta("getCities", {
    FindByString: query.trim(),
    Limit: 20,
  });
  if (!envelope.success) {
    throw new Error(
      `np_cities_failed:${JSON.stringify(envelope.errors || [])}`
    );
  }
  return descriptions(envelope.data);
}

export async function searchNovaWarehouses(
  city: string,
  query: string,
  kind: NovaWarehouseKind = "branch"
): Promise<string[]> {
  // Do not send CategoryOfWarehouse — NP rejects it as a request property
  // ("CategoryOfWarehouse is invalid"). Filter by response fields instead.
  const envelope = await callNovaPoshta("getWarehouses", {
    CityName: city.trim(),
    FindByString: query.trim(),
    Limit: 50,
  });

  if (!envelope.success) {
    throw new Error(
      `np_warehouses_failed:${JSON.stringify(envelope.errors || [])}`
    );
  }

  const rows = Array.isArray(envelope.data) ? envelope.data : [];
  const filtered =
    kind === "locker"
      ? rows.filter(isLockerRow)
      : rows.filter((row) => !isLockerRow(row));

  const list = descriptions(filtered.length ? filtered : rows);
  return list.slice(0, 20);
}
