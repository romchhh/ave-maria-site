"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ClientDetail as ClientDetailType } from "@/lib/clients";
import {
  DELIVERY_LABELS,
  formatAdminDate,
  formatAdminMoney,
  orderStatusBadgeColor,
  orderStatusLabel,
} from "@/lib/adminOrderStatus";
import Badge from "@/components/admin/ui/badge/Badge";

export default function ClientDetail({ id }: { id: string }) {
  const [client, setClient] = useState<ClientDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/clients/${encodeURIComponent(id)}`,
        { credentials: "include", cache: "no-store" }
      );
      if (res.status === 404) {
        setClient(null);
        setError("Клієнта не знайдено");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setClient((await res.json()) as ClientDetailType);
    } catch (e) {
      console.error("Error fetching client:", e);
      setError("Не вдалося завантажити клієнта");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="admin-panel p-6 text-sm text-gray-500">Завантаження…</div>
    );
  }

  if (error || !client) {
    return (
      <div className="admin-panel space-y-4 p-6">
        <p className="text-sm text-red-500">{error || "Не знайдено"}</p>
        <Link href="/admin/clients" className="admin-btn-secondary">
          До списку клієнтів
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="admin-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {client.customerName}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Клієнт зʼявився з історії замовлень
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="admin-btn-secondary !py-2 text-[13px]"
          >
            Оновити
          </button>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Телефон
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              <a href={`tel:${client.phone}`} className="hover:underline">
                {client.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Email
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {client.email ? (
                <a href={`mailto:${client.email}`} className="hover:underline">
                  {client.email}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Міста
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {client.cities.length ? client.cities.join(", ") : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Замовлень
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {client.orderCount}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Сума покупок
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {formatAdminMoney(client.totalSpent)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Останнє замовлення
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {formatAdminDate(client.lastOrderAt)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h3 className="admin-panel-title">Замовлення клієнта</h3>
            <p className="admin-panel-desc">
              Усі замовлення з цим номером телефону
            </p>
          </div>
        </div>

        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {client.orders.map((o) => (
            <li
              key={o.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/orders/${encodeURIComponent(o.id)}/edit`}
                    className="font-medium text-gray-900 hover:underline dark:text-white"
                  >
                    {o.id}
                  </Link>
                  <Badge color={orderStatusBadgeColor(o.status)} size="sm">
                    {orderStatusLabel(o.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {formatAdminDate(o.createdAt)} ·{" "}
                  {DELIVERY_LABELS[o.deliveryMethod] || o.deliveryMethod}
                  {o.city ? ` · ${o.city}` : ""}
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {o.items
                    .map((item) => `${item.name} ×${item.quantity}`)
                    .join(", ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatAdminMoney(o.total)}
                </span>
                <Link
                  href={`/admin/orders/${encodeURIComponent(o.id)}/edit`}
                  className="admin-btn-ghost"
                >
                  Відкрити
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
