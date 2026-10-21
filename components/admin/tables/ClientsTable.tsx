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
import type { ClientSummary } from "@/lib/clients";
import { formatAdminDate, formatAdminMoney } from "@/lib/adminOrderStatus";

const PER_PAGE = 12;

const thClass =
  "px-5 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300";
const tdClass = "px-5 py-4 text-sm text-gray-600 dark:text-gray-400";

export default function ClientsTable() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/clients", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ClientSummary[];
      setClients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching clients:", e);
      setError("Не вдалося завантажити клієнтів");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const hay = [
        c.customerName,
        c.phone,
        c.email || "",
        c.cities.join(" "),
        c.id,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [clients, query]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () =>
      filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
    [filtered, currentPage]
  );

  const totalSpent = useMemo(
    () => clients.reduce((sum, c) => sum + c.totalSpent, 0),
    [clients]
  );

  return (
    <div className="admin-panel">
      <div className="admin-panel-head flex-wrap gap-3">
        <div>
          <h2 className="admin-panel-title">
            Клієнти{" "}
            <span className="font-normal text-gray-400">
              ({filtered.length}
              {query ? ` / ${clients.length}` : ""})
            </span>
          </h2>
          <p className="admin-panel-desc">
            Сума покупок без скасованих: {formatAdminMoney(totalSpent)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук: імʼя, телефон, email, місто…"
            className="min-w-[220px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <button
            type="button"
            onClick={load}
            className="admin-btn-secondary !py-2 text-[13px]"
          >
            Оновити
          </button>
        </div>
      </div>

      {error && <div className="px-5 py-4 text-sm text-red-500">{error}</div>}

      <div className="hidden overflow-x-auto md:block">
        <div className="min-w-[900px]">
          <Table>
            <TableHeader>
              <TableRow>
                <th className={thClass}>Клієнт</th>
                <th className={thClass}>Телефон</th>
                <th className={thClass}>Email</th>
                <th className={thClass}>Міста</th>
                <th className={thClass}>Замовлень</th>
                <th className={thClass}>Сума</th>
                <th className={thClass}>Останнє</th>
                <th className={thClass} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={8} className={tdClass}>
                    Завантаження…
                  </TableCell>
                </TableRow>
              )}
              {!loading && paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className={tdClass}>
                    Клієнтів поки немає — вони зʼявляться після замовлень.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                paginated.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className={`${tdClass} font-medium text-gray-900 dark:text-white`}>
                      {c.customerName}
                    </TableCell>
                    <TableCell className={tdClass}>
                      <a
                        href={`tel:${c.phone}`}
                        className="hover:underline"
                      >
                        {c.phone}
                      </a>
                    </TableCell>
                    <TableCell className={tdClass}>
                      {c.email ? (
                        <a
                          href={`mailto:${c.email}`}
                          className="hover:underline"
                        >
                          {c.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className={tdClass}>
                      {c.cities.length ? c.cities.join(", ") : "—"}
                    </TableCell>
                    <TableCell className={tdClass}>{c.orderCount}</TableCell>
                    <TableCell className={tdClass}>
                      {formatAdminMoney(c.totalSpent)}
                    </TableCell>
                    <TableCell className={tdClass}>
                      {formatAdminDate(c.lastOrderAt)}
                    </TableCell>
                    <TableCell className={tdClass}>
                      <Link
                        href={`/admin/clients/${encodeURIComponent(c.id)}`}
                        className="admin-btn-ghost"
                      >
                        Відкрити
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {loading && (
          <p className="text-sm text-gray-500">Завантаження…</p>
        )}
        {!loading && paginated.length === 0 && (
          <p className="text-sm text-gray-500">
            Клієнтів поки немає — вони зʼявляться після замовлень.
          </p>
        )}
        {paginated.map((c) => (
          <Link
            key={c.id}
            href={`/admin/clients/${encodeURIComponent(c.id)}`}
            className="block rounded-xl border border-gray-200 p-4 transition hover:border-gray-400 dark:border-gray-700"
          >
            <div className="font-medium text-gray-900 dark:text-white">
              {c.customerName}
            </div>
            <div className="mt-1 text-sm text-gray-500">{c.phone}</div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
              <span>{c.orderCount} зам.</span>
              <span>{formatAdminMoney(c.totalSpent)}</span>
              <span>{formatAdminDate(c.lastOrderAt)}</span>
            </div>
          </Link>
        ))}
      </div>

      {!loading && filtered.length > PER_PAGE && (
        <div className="border-t border-gray-100 px-4 py-4 dark:border-gray-800">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
