"use client";

import { formatMoney } from "@/lib/format";
import {
  FREE_GIFT_UAH,
  freeGiftProgress,
  freeGiftRemaining,
  hasFreeGift,
} from "@/lib/freeGift";
import { useBasket } from "@/lib/BasketProvider";

function IconGift({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5h16v9.5H4v-9.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 7.5h17v3H3.5v-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 7.5V20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 7.5c-1.8-2.4-4.2-2.6-5.2-1.4S6.5 9 8.2 9.2c1.2.1 2.6-.4 3.8-1.7zM12 7.5c1.8-2.4 4.2-2.6 5.2-1.4s.3 2.9-1.4 3.1c-1.2.1-2.6-.4-3.8-1.7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FreeGiftBar({
  className = "",
  total: totalOverride,
}: {
  className?: string;
  /** Optional override (e.g. checkout already has total in scope). */
  total?: number;
}) {
  const { total: basketTotal } = useBasket();
  const total = totalOverride ?? basketTotal;
  const remaining = freeGiftRemaining(total);
  const progress = freeGiftProgress(total);
  const unlocked = hasFreeGift(total);

  const message = unlocked ? (
    <>
      Подарунок від Zola <strong>вже ваш</strong>
    </>
  ) : (
    <>
      До подарунка від Zola ще{" "}
      <strong>{formatMoney(remaining || FREE_GIFT_UAH)}</strong>
    </>
  );

  return (
    <div
      className={`free-ship free-ship--gift${unlocked ? " is-unlocked" : ""}${className ? ` ${className}` : ""}`}
      role="status"
    >
      <p className="free-ship-text">
        <IconGift className="free-ship-icon" />
        <span>{message}</span>
      </p>
      <div className="free-ship-track" aria-hidden>
        <span
          className="free-ship-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
