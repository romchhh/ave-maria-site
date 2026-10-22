import type { SortOrder } from "@/components/layout/SidebarFilter";

const PAGE_STEP = 12;

export type CatalogQueryState = {
  sort: SortOrder;
  categories: string[];
  sizes: string[];
  colors: string[];
  brands: string[];
  minPrice: number | null;
  maxPrice: number | null;
  limit: number;
};

export function parseCatalogSearchParams(
  params: URLSearchParams
): CatalogQueryState {
  const sortRaw = params.get("sort");
  const sort: SortOrder =
    sortRaw === "asc" || sortRaw === "desc" || sortRaw === "newest"
      ? sortRaw
      : "newest";

  const split = (key: string) =>
    params
      .get(key)
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const minRaw = params.get("min");
  const maxRaw = params.get("max");
  const limitRaw = params.get("limit");
  const limit = Math.max(
    PAGE_STEP,
    Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : PAGE_STEP
  );

  const fromList = split("categories");
  const legacy = params.get("category")?.trim();
  const categories =
    fromList.length > 0
      ? fromList
      : legacy && legacy !== "all"
        ? [legacy]
        : [];

  return {
    sort,
    categories,
    sizes: split("sizes"),
    colors: split("colors"),
    brands: split("brands"),
    minPrice: minRaw != null && minRaw !== "" ? Number(minRaw) : null,
    maxPrice: maxRaw != null && maxRaw !== "" ? Number(maxRaw) : null,
    limit,
  };
}

export function buildCatalogSearchParams(
  state: CatalogQueryState
): URLSearchParams {
  const next = new URLSearchParams();
  if (state.categories.length) {
    next.set("categories", state.categories.join(","));
  }

  if (state.sort !== "newest") next.set("sort", state.sort);
  if (state.sizes.length) next.set("sizes", state.sizes.join(","));
  if (state.colors.length) next.set("colors", state.colors.join(","));
  if (state.brands.length) next.set("brands", state.brands.join(","));
  if (state.minPrice != null) next.set("min", String(state.minPrice));
  if (state.maxPrice != null) next.set("max", String(state.maxPrice));
  if (state.limit > PAGE_STEP) next.set("limit", String(state.limit));

  return next;
}

export { PAGE_STEP as CATALOG_PAGE_STEP };
