"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/admin/ui/badge/Badge";
import Pagination from "./Pagination";
import { getProductImageSrc } from "@/lib/getFirstProductImage";
import type { Category } from "@/lib/categories";
import type { Product } from "@/lib/types";

const PER_PAGE = 20;

type StockFilter = "all" | "in" | "out";
type VisibilityFilter = "all" | "shown" | "hidden";

export default function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>(
    {}
  );
  const [categoryOptions, setCategoryOptions] = useState<
    { id: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>("all");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const categoryLabel = useCallback(
    (id?: string) => {
      if (!id) return "—";
      return categoryLabels[id] ?? id;
    },
    [categoryLabels]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, catsRes] = await Promise.all([
        fetch("/api/admin/products", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/admin/categories", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      if (!productsRes.ok) {
        let detail = `HTTP ${productsRes.status}`;
        try {
          const body = (await productsRes.json()) as {
            message?: string;
            error?: string;
          };
          if (body.message) detail = body.message;
          else if (body.error) detail = body.error;
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }

      const data = (await productsRes.json()) as Product[];
      if (!Array.isArray(data)) {
        throw new Error("Некоректна відповідь сервера");
      }
      setProducts(data);

      if (catsRes.ok) {
        const cats = (await catsRes.json()) as Category[];
        if (Array.isArray(cats)) {
          const shopCats = cats.filter((c) => c.kind === "category");
          setCategoryLabels(
            Object.fromEntries(cats.map((c) => [c.id, c.label.uk]))
          );
          setCategoryOptions(
            shopCats.map((c) => ({ id: c.id, label: c.label.uk }))
          );
        }
      }
    } catch (e) {
      console.error("Error fetching products:", e);
      setError(
        e instanceof Error && e.message
          ? `Не вдалося завантажити товари: ${e.message}`
          : "Не вдалося завантажити товари"
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) {
        return false;
      }
      if (stockFilter === "in" && !p.inStock) return false;
      if (stockFilter === "out" && p.inStock) return false;
      if (visibilityFilter === "shown" && p.isVisible === false) return false;
      if (visibilityFilter === "hidden" && p.isVisible !== false) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        categoryLabel(p.category).toLowerCase().includes(q) ||
        String(p.sku ?? "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [
    products,
    search,
    categoryFilter,
    stockFilter,
    visibilityFilter,
    categoryLabel,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
    [filtered, currentPage]
  );

  const counts = useMemo(() => {
    const out = products.filter((p) => !p.inStock).length;
    const hidden = products.filter((p) => p.isVisible === false).length;
    return { total: products.length, out, hidden };
  }, [products]);

  async function patchFlags(
    product: Product,
    patch: { inStock?: boolean; isVisible?: boolean }
  ) {
    setBusyId(product.id);
    const prev = product;
    setProducts((list) =>
      list.map((p) => (p.id === product.id ? { ...p, ...patch } : p))
    );
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(product.id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = (await res.json()) as Product;
      setProducts((list) =>
        list.map((p) =>
          p.id === product.id
            ? {
                ...p,
                inStock: updated.inStock,
                isVisible: updated.isVisible !== false,
              }
            : p
        )
      );
    } catch (e) {
      console.error(e);
      setProducts((list) =>
        list.map((p) => (p.id === product.id ? prev : p))
      );
      alert("Не вдалося оновити товар");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Видалити «${product.name}»?`)) return;
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(product.id)}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (e) {
      console.error("Error deleting product:", e);
      alert("Не вдалося видалити товар");
    }
  }

  async function handleDuplicate(product: Product) {
    setBusyId(product.id);
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(product.id)}/duplicate`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const copy = (await res.json()) as Product;
      window.location.href = `/admin/products/${encodeURIComponent(copy.id)}/edit`;
    } catch (e) {
      console.error(e);
      alert("Не вдалося скопіювати товар");
      setBusyId(null);
    }
  }

  function resetFilters() {
    setSearch("");
    setCategoryFilter("all");
    setStockFilter("all");
    setVisibilityFilter("all");
    setPage(1);
  }

  const selectClass =
    "admin-input !py-2 !text-[13px] sm:w-auto min-w-[9.5rem]";

  return (
    <div className="admin-panel">
      <div className="admin-panel-head" data-tour="tour-products-toolbar">
        <div>
          <h2 className="admin-panel-title">
            Каталог{" "}
            <span className="font-normal text-gray-400">
              ({filtered.length}
              {filtered.length !== counts.total
                ? ` з ${counts.total}`
                : ""}
              )
            </span>
          </h2>
          {!loading && counts.total > 0 && (
            <p className="mt-1 text-xs text-gray-400">
              Немає в наявності: {counts.out} · Приховані: {counts.hidden}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="admin-btn-secondary !py-2 text-[13px]"
          title="Оновити список"
        >
          Оновити
        </button>
      </div>

      <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-3 dark:border-white/[0.05] sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Пошук: назва, ID…"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="admin-input sm:min-w-[220px] sm:flex-1"
        />
        <select
          className={selectClass}
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Категорія"
        >
          <option value="all">Усі категорії</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={stockFilter}
          onChange={(e) => {
            setStockFilter(e.target.value as StockFilter);
            setPage(1);
          }}
          aria-label="Наявність"
        >
          <option value="all">Уся наявність</option>
          <option value="in">В наявності</option>
          <option value="out">Немає</option>
        </select>
        <select
          className={selectClass}
          value={visibilityFilter}
          onChange={(e) => {
            setVisibilityFilter(e.target.value as VisibilityFilter);
            setPage(1);
          }}
          aria-label="Видимість"
        >
          <option value="all">Усі в каталозі</option>
          <option value="shown">Показуються</option>
          <option value="hidden">Приховані</option>
        </select>
        {(search ||
          categoryFilter !== "all" ||
          stockFilter !== "all" ||
          visibilityFilter !== "all") && (
          <button
            type="button"
            onClick={resetFilters}
            className="admin-btn-ghost text-[13px]"
          >
            Скинути
          </button>
        )}
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="admin-btn-secondary !py-1.5 !text-xs"
          >
            Спробувати ще
          </button>
        </div>
      )}

      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[920px] text-left">
          <thead>
            <tr className="border-b border-gray-100 text-[12px] uppercase tracking-wide text-gray-400 dark:border-white/[0.05]">
              <th className="px-5 py-3 font-medium">Товар</th>
              <th className="px-4 py-3 font-medium">Категорія</th>
              <th className="px-4 py-3 font-medium">Ціна</th>
              <th className="px-4 py-3 font-medium">Наявність</th>
              <th className="px-4 py-3 font-medium">У каталозі</th>
              <th className="px-5 py-3 font-medium text-right">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-gray-500"
                >
                  Завантаження…
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-gray-500"
                >
                  Товарів не знайдено
                </td>
              </tr>
            ) : (
              paginated.map((p) => {
                const busy = busyId === p.id;
                const editHref = `/admin/products/${encodeURIComponent(p.id)}/edit`;
                return (
                  <tr
                    key={p.id}
                    className={`group transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.03] ${
                      p.isVisible === false ? "opacity-70" : ""
                    }`}
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={editHref}
                        className="flex min-w-0 items-center gap-3"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getProductImageSrc(p.images)}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-md border border-gray-200 object-cover dark:border-gray-700"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-gray-900 group-hover:underline dark:text-white">
                            {p.name}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-[11px] text-gray-400">
                              {p.id}
                            </span>
                            {p.isNew && (
                              <Badge size="sm" color="primary">
                                New
                              </Badge>
                            )}
                            {p.isSale && (
                              <Badge size="sm" color="error">
                                Sale
                              </Badge>
                            )}
                            {p.isPopular && (
                              <Badge size="sm" color="warning">
                                Popular
                              </Badge>
                            )}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {categoryLabel(p.category)}
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums text-gray-800 dark:text-white/90">
                      {(p.priceNum || 0).toLocaleString("uk-UA")} ₴
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void patchFlags(p, { inStock: !p.inStock })
                        }
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-50 ${
                          p.inStock
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
                        }`}
                        title="Натисніть, щоб змінити"
                      >
                        {p.inStock ? "В наявності" : "Немає"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void patchFlags(p, {
                            isVisible: p.isVisible === false,
                          })
                        }
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-50 ${
                          p.isVisible !== false
                            ? "bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-400"
                        }`}
                        title="Показувати / ховати в каталозі"
                      >
                        {p.isVisible !== false ? "Показується" : "Прихований"}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <Link href={editHref} className="admin-btn-ghost">
                          Змінити
                        </Link>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDuplicate(p)}
                          className="admin-btn-ghost disabled:opacity-50"
                        >
                          Копія
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDelete(p)}
                          className="admin-btn-ghost text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          Видалити
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="divide-y divide-gray-100 dark:divide-white/[0.05] md:hidden">
        {loading ? (
          <div className="p-5 text-center text-sm text-gray-500">
            Завантаження…
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-5 text-center text-sm text-gray-500">
            Товарів не знайдено
          </div>
        ) : (
          paginated.map((p) => {
            const busy = busyId === p.id;
            const editHref = `/admin/products/${encodeURIComponent(p.id)}/edit`;
            return (
              <div
                key={p.id}
                className={`flex gap-3 p-4 ${
                  p.isVisible === false ? "opacity-70" : ""
                }`}
              >
                <Link href={editHref} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getProductImageSrc(p.images)}
                    alt=""
                    className="h-16 w-16 rounded-md border border-gray-200 object-cover dark:border-gray-700"
                  />
                </Link>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <Link
                      href={editHref}
                      className="font-medium text-gray-900 dark:text-white"
                    >
                      {p.name}
                    </Link>
                    <div className="text-xs text-gray-500">
                      {categoryLabel(p.category)} ·{" "}
                      {(p.priceNum || 0).toLocaleString("uk-UA")} ₴
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void patchFlags(p, { inStock: !p.inStock })
                      }
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        p.inStock
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {p.inStock ? "В наявності" : "Немає"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void patchFlags(p, {
                          isVisible: p.isVisible === false,
                        })
                      }
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        p.isVisible !== false
                          ? "bg-brand-50 text-brand-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {p.isVisible !== false ? "У каталозі" : "Прихований"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Link href={editHref} className="admin-btn-ghost">
                      Змінити
                    </Link>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDuplicate(p)}
                      className="admin-btn-ghost"
                    >
                      Копія
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDelete(p)}
                      className="admin-btn-ghost text-red-600"
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && filtered.length > PER_PAGE && (
        <div className="flex justify-end border-t border-gray-100 px-5 py-4 dark:border-white/[0.05]">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setPage(Math.min(Math.max(1, p), totalPages))}
          />
        </div>
      )}
    </div>
  );
}
