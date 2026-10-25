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
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMorePending = useRef(false);

  const q = useMemo(
    () => parseCatalogSearchParams(searchParams),
    [searchParams]
  );

  /** Local page size — URL updates on load-more caused scroll jump. */
  const [visibleCount, setVisibleCount] = useState(
    () => Math.max(CATALOG_PAGE_STEP, q.limit)
  );
  const filtersKey = useMemo(
    () =>
      [
        q.sort,
        q.categories.join(","),
        q.sizes.join(","),
        q.colors.join(","),
        q.brands.join(","),
        q.minPrice ?? "",
        q.maxPrice ?? "",
      ].join("|"),
    [q]
  );

  const prevFiltersKey = useRef<string | null>(null);
  useEffect(() => {
    if (prevFiltersKey.current === null) {
      prevFiltersKey.current = filtersKey;
      return;
    }
    if (prevFiltersKey.current === filtersKey) return;
    prevFiltersKey.current = filtersKey;
    setVisibleCount(CATALOG_PAGE_STEP);
    loadMorePending.current = false;
  }, [filtersKey]);

  const catalogPath = sitePath("catalog");

  const replaceCatalogQuery = useCallback(
    (patch: Partial<ReturnType<typeof parseCatalogSearchParams>>) => {
      const base = parseCatalogSearchParams(searchParams);
      const next = {
        ...base,
        ...patch,
        // Never sync infinite-scroll count into the URL.
        limit: CATALOG_PAGE_STEP,
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
      replaceCatalogQuery({ categories: next });
    },
    [q.categories, replaceCatalogQuery]
  );

  const setSortOrder = useCallback(
    (v: SortOrder) => replaceCatalogQuery({ sort: v }),
    [replaceCatalogQuery]
  );
  const setSelectedSizes = useCallback(
    (v: string[] | ((prev: string[]) => string[])) => {
      const next = typeof v === "function" ? v(q.sizes) : v;
      replaceCatalogQuery({ sizes: next });
    },
    [q.sizes, replaceCatalogQuery]
  );
  const setSelectedColors = useCallback(
    (v: string[] | ((prev: string[]) => string[])) => {
      const next = typeof v === "function" ? v(q.colors) : v;
      replaceCatalogQuery({ colors: next });
    },
    [q.colors, replaceCatalogQuery]
  );
  const setSelectedBrands = useCallback(
    (v: string[] | ((prev: string[]) => string[])) => {
      const next = typeof v === "function" ? v(q.brands) : v;
      replaceCatalogQuery({ brands: next });
    },
    [q.brands, replaceCatalogQuery]
  );
  const setMinPrice = useCallback(
    (v: number | null) => replaceCatalogQuery({ minPrice: v }),
    [replaceCatalogQuery]
  );
  const setMaxPrice = useCallback(
    (v: number | null) => replaceCatalogQuery({ maxPrice: v }),
    [replaceCatalogQuery]
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
        q.categories,
        categories
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
  }, [products, q, categories]);

  const sortedProducts = useMemo(() => {
    if (q.sort === "newest") return filteredProducts;
    return [...filteredProducts].sort((a, b) => {
      const pa = Number(a.priceNum) || 0;
      const pb = Number(b.priceNum) || 0;
      return q.sort === "asc" ? pa - pb : pb - pa;
    });
  }, [filteredProducts, q.sort]);

  const visibleProducts = sortedProducts.slice(0, visibleCount);
  const hasMore = visibleCount < sortedProducts.length;

  useEffect(() => {
    loadMorePending.current = false;
  }, [visibleCount]);

  useEffect(() => {
    if (!hasMore) return;
    const node = loadMoreSentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || loadMorePending.current) return;
        loadMorePending.current = true;
        setVisibleCount((n) => n + CATALOG_PAGE_STEP);
      },
      { root: null, rootMargin: "480px 0px", threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, visibleProducts.length]);

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
    if (scrollRestored.current) return;
    const raw = sessionStorage.getItem(scrollKey);
    if (!raw) return;

    let y = 0;
    let count = CATALOG_PAGE_STEP;
    try {
      const parsed = JSON.parse(raw) as { y?: number; count?: number };
      if (typeof parsed?.y === "number") y = parsed.y;
      if (typeof parsed?.count === "number") count = parsed.count;
    } catch {
      y = parseInt(raw, 10);
    }
    if (!Number.isFinite(y) || y <= 0) {
      scrollRestored.current = true;
      return;
    }

    if (Number.isFinite(count) && count > CATALOG_PAGE_STEP) {
      setVisibleCount((n) => Math.max(n, count));
    }

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
  }, [scrollKey]);

  useEffect(() => {
    const save = () => {
      sessionStorage.setItem(
        scrollKey,
        JSON.stringify({ y: window.scrollY, count: visibleCount })
      );
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
  }, [scrollKey, visibleCount]);

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
            <div
              ref={loadMoreSentinelRef}
              className="cat-more cat-more--sentinel"
              aria-hidden="true"
            />
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
