"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ComponentCard from "@/components/admin/ComponentCard";
import PageBreadcrumb from "@/components/admin/PageBreadCrumb";
import Label from "@/components/admin/form/Label";
import Select from "@/components/admin/form/Select";
import TextArea from "@/components/admin/form/input/TextArea";
import type { StoredOrder } from "@/lib/adminStore";
import {
  ORDER_STATUS_OPTIONS,
  deliveryLabel,
  formatAdminDate,
  formatAdminMoney,
} from "@/lib/adminOrderStatus";

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-400">
        {label}
      </div>
      <div className="mt-1 text-sm text-gray-800 dark:text-white/90">
        {value || "—"}
      </div>
    </div>
  );
}

export default function EditOrderPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ? decodeURIComponent(String(params.id)) : "";
  const router = useRouter();

  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [status, setStatus] = useState<string>("new");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/orders/${encodeURIComponent(orderId)}`,
          { credentials: "include", cache: "no-store" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as StoredOrder;
        if (cancelled) return;
        setOrder(data);
        setStatus(data.status);
        setComment(data.comment ?? "");
      } catch (e) {
        console.error("Error loading order:", e);
        if (!cancelled) setError("Не вдалося завантажити замовлення");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, comment }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.push("/admin/orders");
      router.refresh();
    } catch (e) {
      console.error("Error saving order:", e);
      setError("Не вдалося зберегти замовлення");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageBreadcrumb pageTitle={`Замовлення ${orderId}`} />

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-500 dark:border-white/[0.05] dark:bg-white/[0.03]">
          Завантаження...
        </div>
      ) : !order ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error || "Замовлення не знайдено"}
          </div>
          <Link
            href="/admin/orders"
            className="text-sm text-brand-500 underline"
          >
            ← До списку замовлень
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <ComponentCard title="Клієнт і доставка">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Row label="ID" value={order.id} />
              <Row label="Дата" value={formatAdminDate(order.createdAt)} />
              <Row label="Мова" value={order.locale?.toUpperCase()} />
              <Row label="Імʼя" value={order.customerName} />
              <Row
                label="Телефон"
                value={
                  order.phone ? (
                    <a href={`tel:${order.phone}`} className="hover:underline">
                      {order.phone}
                    </a>
                  ) : undefined
                }
              />
              <Row label="Email" value={order.email} />
              <Row label="Доставка" value={deliveryLabel(order.deliveryMethod)} />
              <Row label="Місто" value={order.city} />
              <Row label="Адреса / відділення" value={order.address} />
            </div>
          </ComponentCard>

          <ComponentCard title="Товари">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <th className="py-2 pr-4 font-medium w-14" />
                    <th className="py-2 pr-4 font-medium">Назва</th>
                    <th className="py-2 pr-4 font-medium">Розмір</th>
                    <th className="py-2 pr-4 font-medium">Кількість</th>
                    <th className="py-2 pr-4 font-medium">Ціна</th>
                    <th className="py-2 font-medium">Разом</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(order.items ?? []).map((item, i) => (
                    <tr
                      key={`${item.productId}-${item.size}-${i}`}
                      className="text-gray-700 dark:text-gray-300"
                    >
                      <td className="py-2.5 pr-3">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt=""
                            className="h-14 w-11 rounded-md border border-gray-200 object-cover dark:border-gray-700"
                          />
                        ) : (
                          <div className="flex h-14 w-11 items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 text-[10px] text-gray-400 dark:border-gray-700 dark:bg-white/[0.03]">
                            —
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </div>
                        {item.productId && (
                          <Link
                            href={`/admin/products/${encodeURIComponent(item.productId)}/edit`}
                            className="mt-0.5 block text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          >
                            {item.productId}
                          </Link>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">{item.size || "—"}</td>
                      <td className="py-2.5 pr-4 tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums">
                        {formatAdminMoney(item.priceNum)}
                      </td>
                      <td className="py-2.5 tabular-nums">
                        {formatAdminMoney(
                          (Number(item.priceNum) || 0) *
                            (Number(item.quantity) || 1)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 dark:border-gray-700">
                    <td
                      colSpan={5}
                      className="py-3 pr-4 text-right font-medium text-gray-700 dark:text-gray-300"
                    >
                      Всього
                    </td>
                    <td className="py-3 font-semibold tabular-nums text-gray-900 dark:text-white">
                      {formatAdminMoney(order.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </ComponentCard>

          <ComponentCard title="Статус і коментар">
            <div className="max-w-md">
              <Label>Статус</Label>
              <Select
                options={ORDER_STATUS_OPTIONS}
                value={status}
                onChange={setStatus}
              />
            </div>
            <div>
              <Label>Коментар</Label>
              <TextArea
                rows={4}
                value={comment}
                onChange={setComment}
                placeholder="Нотатки до замовлення"
              />
            </div>
          </ComponentCard>

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/admin/orders"
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            >
              Скасувати
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-green-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Збереження..." : "Зберегти"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
