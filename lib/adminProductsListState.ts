/** Persist admin products list filters across edit navigation. */

export const ADMIN_PRODUCTS_LIST_QS_KEY = "ave-admin-products-list-qs";

export type AdminProductsListState = {
  q: string;
  category: string;
  stock: "all" | "in" | "out";
  visibility: "all" | "shown" | "hidden";
  page: number;
};

export const DEFAULT_ADMIN_PRODUCTS_LIST: AdminProductsListState = {
  q: "",
  category: "all",
  stock: "all",
  visibility: "all",
  page: 1,
};

export function parseAdminProductsListState(
  params: URLSearchParams | { get(name: string): string | null }
): AdminProductsListState {
  const stockRaw = params.get("stock");
  const visibilityRaw = params.get("vis");
  const pageRaw = Number(params.get("page") || "1");

  return {
    q: params.get("q")?.trim() || "",
    category: params.get("cat")?.trim() || "all",
    stock:
      stockRaw === "in" || stockRaw === "out" || stockRaw === "all"
        ? stockRaw
        : "all",
    visibility:
      visibilityRaw === "shown" ||
      visibilityRaw === "hidden" ||
      visibilityRaw === "all"
        ? visibilityRaw
        : "all",
    page: Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1,
  };
}

export function buildAdminProductsListQuery(
  state: AdminProductsListState
): string {
  const sp = new URLSearchParams();
  if (state.q.trim()) sp.set("q", state.q.trim());
  if (state.category && state.category !== "all") sp.set("cat", state.category);
  if (state.stock !== "all") sp.set("stock", state.stock);
  if (state.visibility !== "all") sp.set("vis", state.visibility);
  if (state.page > 1) sp.set("page", String(state.page));
  return sp.toString();
}

export function adminProductsListHref(state?: AdminProductsListState): string {
  const qs = state
    ? buildAdminProductsListQuery(state)
    : typeof window !== "undefined"
      ? sessionStorage.getItem(ADMIN_PRODUCTS_LIST_QS_KEY) || ""
      : "";
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

export function rememberAdminProductsListQuery(qs: string) {
  try {
    if (qs) sessionStorage.setItem(ADMIN_PRODUCTS_LIST_QS_KEY, qs);
    else sessionStorage.removeItem(ADMIN_PRODUCTS_LIST_QS_KEY);
  } catch {
    /* ignore */
  }
}
