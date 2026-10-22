"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "./Pagination";
import Badge from "@/components/admin/ui/badge/Badge";
import { getProductImageSrc } from "@/lib/getFirstProductImage";
import type { Category } from "@/lib/categories";
import type { Product } from "@/lib/types";

const PER_PAGE = 10;

const thClass =
  "px-5 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300";
const tdClass = "px-5 py-4 text-sm text-gray-600 dark:text-gray-400";

export default function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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
      if (!productsRes.ok) throw new Error(`HTTP ${productsRes.status}`);
      const data = (await productsRes.json()) as Product[];
      setProducts(Array.isArray(data) ? data : []);
      if (catsRes.ok) {
        const cats = (await catsRes.json()) as Category[];
        if (Array.isArray(cats)) {
          setCategoryLabels(
            Object.fromEntries(cats.map((c) => [c.id, c.label.uk]))
          );
        }
      }
    } catch (e) {
      console.error("Error fetching products:", e);
      setError("Не вдалося завантажити товари");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        categoryLabel(p.category).toLowerCase().includes(q)
    );
  }, [products, search, categoryLabel]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
    [filtered, currentPage]
  );

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

  const stockBadge = (p: Product) => (
    <Badge size="sm" color={p.inStock ? "success" : "error"}>
      {p.inStock ? "В наявності" : "Немає"}
    </Badge>
  );

  async function handleDuplicate(product: Product) {
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
    }
  }

  const actions = (p: Product) => (
    <div className="flex flex-wrap items-center gap-1">
      <Link
        href={`/admin/products/${encodeURIComponent(p.id)}/edit`}
        className="admin-btn-ghost"
      >
        Змінити
      </Link>
      <button
        type="button"
        onClick={() => void handleDuplicate(p)}
        className="admin-btn-ghost"
      >
        Копія
      </button>
      <button
        onClick={() => handleDelete(p)}
        className="admin-btn-ghost text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        Видалити
      </button>
    </div>
  );

  return (
    <div className="admin-panel">
      <div className="admin-panel-head" data-tour="tour-products-toolbar">
        <div>
          <h2 className="admin-panel-title">
            Каталог{" "}
            <span className="font-normal text-gray-400">
              ({filtered.length})
            </span>
          </h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Пошук: назва, ID, категорія"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="admin-input sm:w-72"
          />
          <button
            onClick={load}
            className="admin-btn-secondary !py-2 text-[13px]"
            title="Оновити список"
          >
            Оновити
          </button>
        </div>
      </div>

      {error && (
        <div className="px-5 py-4 text-sm text-red-500">{error}</div>
      )}

      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <div className="min-w-[860px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className={thClass}>
                  Фото
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Назва
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Категорія
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Ціна
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Наявність
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Дії
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    Завантаження...
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    Товарів не знайдено
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="px-5 py-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getProductImageSrc(p.images)}
                        alt={p.name}
                        className="h-14 w-14 rounded-md border border-gray-200 object-cover dark:border-gray-700"
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.id}</div>
                    </TableCell>
                    <TableCell className={tdClass}>
                      {categoryLabel(p.category)}
                      {p.isNew && (
                        <span className="ml-2">
                          <Badge size="sm" color="primary">
                            New
                          </Badge>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={tdClass}>
                      {(p.priceNum || 0).toLocaleString("uk-UA")} ₴
                    </TableCell>
                    <TableCell className={tdClass}>{stockBadge(p)}</TableCell>
                    <TableCell className="px-5 py-4">{actions(p)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-gray-100 dark:divide-white/[0.05] md:hidden">
        {loading ? (
          <div className="p-5 text-center text-sm text-gray-500">
            Завантаження...
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-5 text-center text-sm text-gray-500">
            Товарів не знайдено
          </div>
        ) : (
          paginated.map((p) => (
            <div key={p.id} className="flex gap-3 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getProductImageSrc(p.images)}
                alt={p.name}
                className="h-20 w-20 shrink-0 rounded-md border border-gray-200 object-cover dark:border-gray-700"
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="font-medium text-gray-800 dark:text-white/90">
                  {p.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {categoryLabel(p.category)} ·{" "}
                  {(p.priceNum || 0).toLocaleString("uk-UA")} ₴
                </div>
                <div>{stockBadge(p)}</div>
                {actions(p)}
              </div>
            </div>
          ))
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
