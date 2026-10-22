"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ProductCard from "@/components/catalog/ProductCard";
import SidebarFilter, {
  type SortOrder,
} from "@/components/layout/SidebarFilter";
import {
  CATALOG_PAGE_STEP,
  buildCatalogSearchParams,
  parseCatalogSearchParams,
} from "@/lib/catalogQuery";
import { productMatchesCategoryFilters } from "@/lib/catalogFilters";
import type { Category } from "@/lib/categories";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { sitePath } from "@/lib/i18n/paths";
import type { Product } from "@/lib/types";
import { useScrollLock } from "@/hooks/useScrollLock";

/** Ключ без `limit`, щоб «Показати ще» не скидав скрол */
function stableCatalogSearch(search: string) {
  const p = new URLSearchParams(search);
  p.delete("limit");
  return p.toString();
}

function scrollStorageKey(pathname: string, search: string) {
  const stable = stableCatalogSearch(search);
  return stable
    ? `ave-catalog-scroll:${pathname}?${stable}`
    : `ave-catalog-scroll:${pathname}`;
}

export default function CatalogClient({
  products,
  categories,
  sizes,
  colors,
  brands,
  priceHint,
}: {
  products: Product[];
  categories: Category[];
  sizes: string[];
  colors: string[];
  brands: string[];
  priceHint: { min: number; max: number };
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  useScrollLock(isFilterOpen);
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);
  const scrollRestored = useRef(false);
  const loadMoreScrollY = useRef<number | null>(null);

  const q = useMemo(
    () => parseCatalogSearchParams(searchParams),
    [searchParams]
  );

  const catalogPath = sitePath("catalog");

  const replaceCatalogQuery = useCallback(
    (
      patch: Partial<ReturnType<typeof parseCatalogSearchParams>> & {
        resetLimit?: boolean;
      }
    ) => {
      const base = parseCatalogSearchParams(searchParams);
      const { resetLimit, ...rest } = patch;
      const next = {
        ...base,
        ...rest,
        ...(resetLimit ? { limit: CATALOG_PAGE_STEP } : {}),
      };
      const sp = buildCatalogSearchParams(next);
      const qs = sp.toString();
      router.replace(qs ? `${catalogPath}?${qs}` : catalogPath, {
        scroll: false,
      });
    },
    [searchParams, catalogPath, router]
  );

  const setSelectedCategories = useCallback(
    (v: string[] | ((prev: string[]) => string[])) => {
      const next = typeof v === "function" ? v(q.categories) : v;
      replaceCatalogQuery({ categories: next, resetLimit: true });
    },
    [q.categories, replaceCatalogQuery]
  );

  const setSortOrder = useCallback(
    (v: SortOrder) => replaceCatalogQuery({ sort: v, resetLimit: true }),
    [replaceCatalogQuery]
  );
  const setSelectedSizes = useCallback(
    (v: string[] | ((prev: string[]) => string[])) => {
      const next = typeof v === "function" ? v(q.sizes) : v;
      replaceCatalogQuery({ sizes: next, resetLimit: true });
    },
    [q.sizes, replaceCatalogQuery]
  );
  const setSelectedColors = useCallback(
    (v: string[] | ((prev: string[]) => string[])) => {
      const next = typeof v === "function" ? v(q.colors) : v;
      replaceCatalogQuery({ colors: next, resetLimit: true });
    },
    [q.colors, replaceCatalogQuery]
  );
  const setSelectedBrands = useCallback(
    (v: string[] | ((prev: string[]) => string[])) => {
      const next = typeof v === "function" ? v(q.brands) : v;
      replaceCatalogQuery({ brands: next, resetLimit: true });
    },
    [q.brands, replaceCatalogQuery]
  );
  const setMinPrice = useCallback(
    (v: number | null) => replaceCatalogQuery({ minPrice: v, resetLimit: true }),
    [replaceCatalogQuery]
  );
  const setMaxPrice = useCallback(
    (v: number | null) => replaceCatalogQuery({ maxPrice: v, resetLimit: true }),
    [replaceCatalogQuery]
  );
  const setVisibleCount = useCallback(
    (v: number | ((n: number) => number)) => {
      const next = typeof v === "function" ? v(q.limit) : v;
      replaceCatalogQuery({ limit: next });
    },
    [q.limit, replaceCatalogQuery]
  );

  const activeLabel = useMemo(() => {
    if (q.categories.length === 0) return t.catalog.title;
    const labels = q.categories
      .map((id) => categories.find((c) => c.id === id)?.label.uk)
      .filter(Boolean);
    if (labels.length === 1) return labels[0]!;
    if (labels.length > 1) return labels.join(" · ");
    return t.catalog.title;
  }, [q.categories, categories, t.catalog.title]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = productMatchesCategoryFilters(
        product,
        q.categories
      );

      const matchesSize =
        q.sizes.length === 0 ||
        (product.sizeOptions || []).some((s) => q.sizes.includes(s));

      const colorValues = [
        product.color,
        ...(product.swatches || []).map((s) => s.label),
      ].filter(Boolean) as string[];

      const matchesColor =
        q.colors.length === 0 ||
        q.colors.some((c) => colorValues.includes(c));

      const matchesBrand =
        q.brands.length === 0 ||
        (product.brand != null && q.brands.includes(product.brand));

      const price = Number(product.priceNum) || 0;
      const matchesMin = q.minPrice == null || price >= q.minPrice;
      const matchesMax = q.maxPrice == null || price <= q.maxPrice;

      return (
        matchesCategory &&
        matchesSize &&
        matchesColor &&
        matchesBrand &&
        matchesMin &&
        matchesMax
      );
    });
  }, [products, q]);

  const sortedProducts = useMemo(() => {
    if (q.sort === "newest") return filteredProducts;
    return [...filteredProducts].sort((a, b) => {
      const pa = Number(a.priceNum) || 0;
      const pb = Number(b.priceNum) || 0;
      return q.sort === "asc" ? pa - pb : pb - pa;
    });
  }, [filteredProducts, q.sort]);

  const visibleProducts = sortedProducts.slice(0, q.limit);
  const hasMore = q.limit < sortedProducts.length;
  const activeFilters =
    q.categories.length +
    q.sizes.length +
    q.colors.length +
    q.brands.length +
    (q.minPrice != null ? 1 : 0) +
    (q.maxPrice != null ? 1 : 0) +
    (q.sort !== "newest" ? 1 : 0);

  function resetFilters() {
    router.replace(catalogPath, { scroll: false });
  }

  const scrollKey = scrollStorageKey(pathname, searchString);

  useEffect(() => {
    scrollRestored.current = false;
  }, [scrollKey]);

  useLayoutEffect(() => {
    if (loadMoreScrollY.current != null) {
      const y = loadMoreScrollY.current;
      loadMoreScrollY.current = null;
      const keep = () => window.scrollTo({ top: y, left: 0, behavior: "auto" });
      keep();
      requestAnimationFrame(keep);
      return;
    }

    if (scrollRestored.current) return;
    const raw = sessionStorage.getItem(scrollKey);
    if (!raw) return;
    const y = parseInt(raw, 10);
    if (!Number.isFinite(y)) return;

    const restore = () => window.scrollTo({ top: y, left: 0, behavior: "auto" });
    restore();
    requestAnimationFrame(restore);
    const t1 = window.setTimeout(restore, 0);
    const t2 = window.setTimeout(restore, 80);
    scrollRestored.current = true;
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [scrollKey, q.limit, visibleProducts.length]);

  useEffect(() => {
    const save = () => {
      sessionStorage.setItem(scrollKey, String(window.scrollY));
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(save, 120);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      save();
    };
  }, [scrollKey]);

  return (
    <div className="cat-shell">
      <div className="cat-toolbar">
        <div>
          <h1 className="cat-title">{activeLabel}</h1>
          <p className="cat-count is-visible">
            {t.catalog.count(sortedProducts.length)}
          </p>
        </div>
        <button
          type="button"
          className={`cat-filter-btn${activeFilters > 0 ? " has-active" : ""}`}
          onClick={() => setIsFilterOpen(true)}
        >
          {t.catalog.filters}
          {activeFilters > 0 && (
            <span className="cat-filter-badge">{activeFilters}</span>
          )}
        </button>
      </div>

      {sortedProducts.length === 0 ? (
        <p className="cat-empty">{t.catalog.empty}</p>
      ) : (
        <>
          <div className="products">
            {visibleProducts.map((p, index) => (
              <ProductCard
                key={p.id}
                product={p}
                priority={index < 4}
              />
            ))}
          </div>
          {hasMore && (
            <div className="cat-more">
              <button
                type="button"
                className="cat-more-btn"
                onClick={() => {
                  loadMoreScrollY.current = window.scrollY;
                  setVisibleCount((n) => n + CATALOG_PAGE_STEP);
                }}
              >
                {t.catalog.showMore}
              </button>
            </div>
          )}
        </>
      )}

      <SidebarFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        openAccordion={openAccordion}
        setOpenAccordion={setOpenAccordion}
        sortOrder={q.sort}
        setSortOrder={setSortOrder}
        selectedSizes={q.sizes}
        setSelectedSizes={setSelectedSizes}
        selectedColors={q.colors}
        setSelectedColors={setSelectedColors}
        selectedBrands={q.brands}
        setSelectedBrands={setSelectedBrands}
        minPrice={q.minPrice}
        maxPrice={q.maxPrice}
        setMinPrice={setMinPrice}
        setMaxPrice={setMaxPrice}
        sizes={sizes}
        colors={colors}
        brands={brands}
        priceHint={priceHint}
        selectedCategories={q.categories}
        setSelectedCategories={setSelectedCategories}
        categories={categories}
        onReset={resetFilters}
        resultCount={sortedProducts.length}
      />
    </div>
  );
}
