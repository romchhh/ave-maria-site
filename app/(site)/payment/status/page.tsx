"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sitePath } from "@/lib/i18n/paths";

function PaymentStatusInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("Перевіряємо оплату…");

  const invoiceIdFromQuery =
    searchParams.get("invoiceId") || searchParams.get("invoice_id");
  const paymentRefFromQuery = searchParams.get("ref");
  const paymentFlag = searchParams.get("payment");

  const goFinal = useCallback(
    (query: string) => {
      router.replace(`${sitePath("final")}${query}`);
    },
    [router]
  );

  useEffect(() => {
    let cancelled = false;
    let tries = 0;

    async function resolveInvoiceId(): Promise<string | null> {
      if (invoiceIdFromQuery) return invoiceIdFromQuery;

      if (paymentRefFromQuery) {
        try {
          const res = await fetch(
            `/api/orders/by-payment-ref?ref=${encodeURIComponent(paymentRefFromQuery)}`
          );
          if (res.ok) {
            const data = (await res.json()) as { invoiceId?: string | null };
            if (data.invoiceId) {
              try {
                localStorage.setItem("currentInvoiceId", data.invoiceId);
              } catch {
                /* ignore */
              }
              return data.invoiceId;
            }
          }
        } catch (e) {
          console.error("[payment/status] ref resolve", e);
        }
      }

      try {
        return localStorage.getItem("currentInvoiceId");
      } catch {
        return null;
      }
    }

    async function poll() {
      const invoiceId = await resolveInvoiceId();
      if (cancelled) return;

      if (!invoiceId) {
        if (paymentFlag === "failed") {
          goFinal("?payment=failed");
          return;
        }
        setMessage("Не знайдено рахунок. Повертаємось до оформлення…");
        window.setTimeout(() => goFinal(""), 1500);
        return;
      }

      try {
        const res = await fetch(
          `/api/orders/invoice/${encodeURIComponent(invoiceId)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { payment_status?: string };

        if (data.payment_status === "paid") {
          try {
            localStorage.removeItem("currentInvoiceId");
            localStorage.removeItem("currentPaymentRef");
          } catch {
            /* ignore */
          }
          goFinal(
            `?payment=success&invoiceId=${encodeURIComponent(invoiceId)}`
          );
          return;
        }

        if (data.payment_status === "canceled" || paymentFlag === "failed") {
          goFinal(
            `?payment=failed&invoiceId=${encodeURIComponent(invoiceId)}`
          );
          return;
        }

        tries += 1;
        if (tries >= 20) {
          setMessage(
            "Оплату ще не підтверджено. Якщо списали кошти — ми отримаємо webhook і зв’яжемось."
          );
          window.setTimeout(() => goFinal(""), 2500);
          return;
        }

        setMessage("Очікуємо підтвердження від Monobank…");
        window.setTimeout(poll, 1500);
      } catch (e) {
        console.error("[payment/status] poll", e);
        tries += 1;
        if (tries >= 8) {
          goFinal(
            paymentFlag === "success"
              ? `?payment=success&invoiceId=${encodeURIComponent(invoiceId)}`
              : "?payment=failed"
          );
          return;
        }
        window.setTimeout(poll, 1500);
      }
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [invoiceIdFromQuery, paymentRefFromQuery, paymentFlag, goFinal]);

  return (
    <section className="checkout-page">
      <div className="checkout-success" style={{ textAlign: "center" }}>
        <p className="checkout-lead">{message}</p>
      </div>
    </section>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <section className="checkout-page">
          <div className="checkout-success">
            <p className="checkout-lead">Перевіряємо оплату…</p>
          </div>
        </section>
      }
    >
      <PaymentStatusInner />
    </Suspense>
  );
}
