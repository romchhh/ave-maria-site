import { isPaymentFlagOn } from "@/lib/paymentFlags";
import { resolveSetting } from "@/lib/settings";
import type { PaymentType } from "@/lib/types";

export { isPaymentFlagOn, flagToSetting } from "@/lib/paymentFlags";

const ALL_PAYMENT_TYPES: PaymentType[] = ["full", "prepay", "postpay"];

const KEY_BY_TYPE: Record<
  PaymentType,
  "pay_full_enabled" | "pay_prepay_enabled" | "pay_postpay_enabled"
> = {
  full: "pay_full_enabled",
  prepay: "pay_prepay_enabled",
  postpay: "pay_postpay_enabled",
};

export type PaymentMethodsConfig = {
  enabled: PaymentType[];
  full: boolean;
  prepay: boolean;
  postpay: boolean;
  prepayAmountUah: number;
};

export async function getPaymentMethodsConfig(): Promise<PaymentMethodsConfig> {
  const [fullRaw, prepayRaw, postpayRaw, prepayAmountRaw] = await Promise.all([
    resolveSetting("pay_full_enabled"),
    resolveSetting("pay_prepay_enabled"),
    resolveSetting("pay_postpay_enabled"),
    resolveSetting("prepay_amount_uah", [
      process.env.PREPAY_AMOUNT_UAH,
      process.env.NEXT_PUBLIC_PREPAY_AMOUNT_UAH,
    ]),
  ]);

  const full = isPaymentFlagOn(fullRaw);
  const prepay = isPaymentFlagOn(prepayRaw);
  const postpay = isPaymentFlagOn(postpayRaw);
  const n = Number(String(prepayAmountRaw || "300").replace(/\D/g, ""));
  const prepayAmountUah = Number.isFinite(n) && n > 0 ? n : 300;

  const enabled = ALL_PAYMENT_TYPES.filter((type) => {
    if (type === "full") return full;
    if (type === "prepay") return prepay;
    return postpay;
  });

  return { enabled, full, prepay, postpay, prepayAmountUah };
}

export async function isPaymentTypeEnabled(
  type: PaymentType
): Promise<boolean> {
  const raw = await resolveSetting(KEY_BY_TYPE[type]);
  return isPaymentFlagOn(raw);
}

export { ALL_PAYMENT_TYPES };
