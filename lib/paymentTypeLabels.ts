import type { PaymentType } from "@/lib/types";

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  full: "Plata by mono (повна оплата)",
  prepay: "Передоплата",
  postpay: "Післяплата",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Очікує оплату",
  paid: "Оплачено",
  canceled: "Скасовано",
  cod: "Післяплата",
};
