"use client";

import { formatMoney } from "@/lib/format";
import {
  FREE_SHIPPING_UAH,
  freeShippingProgress,
  freeShippingRemaining,
  hasFreeShipping,
} from "@/lib/freeShipping";
import { useBasket } from "@/lib/BasketProvider";

function IconTruck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 7.5h11.5V16H3V7.5z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M14.5 10.5H19l2 3V16h-6.5v-5.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M1 9.5h2M1 12h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function FreeShippingBar({
  className = "",
  total: totalOverride,
}: {
  className?: string;
  /** Optional override (e.g. checkout already has total in scope). */
  total?: number;
}) {
  const { total: basketTotal } = useBasket();
  const total = totalOverride ?? basketTotal;
  const remaining = freeShippingRemaining(total);
  const progress = freeShippingProgress(total);
  const unlocked = hasFreeShipping(total);

  const message = unlocked ? (
    <>
      Безкоштовна доставка <strong>вже ваша</strong>
    </>
  ) : (
    <>
      До безкоштовної доставки ще{" "}
      <strong>{formatMoney(remaining || FREE_SHIPPING_UAH)}</strong>
    </>
  );

  return (
    <div
      className={`free-ship${unlocked ? " is-unlocked" : ""}${className ? ` ${className}` : ""}`}
      role="status"
    >
      <p className="free-ship-text">
        <IconTruck className="free-ship-icon" />
        <span>{message}</span>
      </p>
      <div
        className="free-ship-track"
        aria-hidden
      >
        <span
          className="free-ship-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
