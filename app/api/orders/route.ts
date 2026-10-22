import { NextRequest, NextResponse } from "next/server";
import { appendOrder, readProducts } from "@/lib/adminStore";
import {
  buildMonoFriendlyError,
  createMonobankInvoice,
  getPrepayAmountUah,
} from "@/lib/mono";
import { sendOrderTelegramNotification } from "@/lib/orderTelegram";
import type {
  CheckoutPayload,
  DeliveryMethod,
  PaymentType,
} from "@/lib/types";

export const runtime = "nodejs";

const DELIVERY_METHODS = new Set<DeliveryMethod>([
  "nova_poshta_branch",
  "nova_poshta_locker",
  "nova_poshta_courier",
  "pickup",
  "international",
]);

const PAYMENT_TYPES = new Set<PaymentType>(["full", "prepay", "postpay"]);

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidPayload(body: unknown): body is CheckoutPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Partial<CheckoutPayload>;
  if (typeof b.customerName !== "string" || b.customerName.trim().length < 2) {
    return false;
  }
  if (typeof b.phone !== "string" || digitsOnly(b.phone).length < 10) {
    return false;
  }
  if (
    typeof b.deliveryMethod !== "string" ||
    !DELIVERY_METHODS.has(b.deliveryMethod as DeliveryMethod)
  ) {
    return false;
  }
  if (typeof b.city !== "string" || !b.city.trim()) return false;
  if (typeof b.address !== "string" || !b.address.trim()) return false;
  if (
    typeof b.paymentType !== "string" ||
    !PAYMENT_TYPES.has(b.paymentType as PaymentType)
  ) {
    return false;
  }
  if (!Array.isArray(b.items) || !b.items.length) return false;
  return b.items.every(
    (item) =>
      item &&
      typeof item.productId === "string" &&
      typeof item.name === "string" &&
      typeof item.size === "string" &&
      Number(item.quantity) >= 1 &&
      Number.isFinite(Number(item.priceNum))
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!isValidPayload(body)) {
      return NextResponse.json(
        { error: "invalid_payload" },
        { status: 400 }
      );
    }

    const paymentType = body.paymentType as PaymentType;

    const payload: CheckoutPayload = {
      customerName: body.customerName.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim() || undefined,
      deliveryMethod: body.deliveryMethod,
      city: body.city.trim(),
      address: body.address.trim(),
      comment: body.comment?.trim() || undefined,
      locale: typeof body.locale === "string" ? body.locale : "uk",
      paymentType,
      items: body.items.map((item) => ({
        productId: String(item.productId),
        name: String(item.name),
        size: String(item.size),
        quantity: Math.max(1, Math.floor(Number(item.quantity))),
        priceNum: Number(item.priceNum) || 0,
      })),
    };

    try {
      const catalog = await readProducts();
      const byId = new Map(catalog.map((p) => [p.id, p]));
      const unavailable = payload.items.filter((item) => {
        const p = byId.get(item.productId);
        return !p || p.inStock === false;
      });
      if (unavailable.length) {
        return NextResponse.json(
          {
            error: "out_of_stock",
            productIds: unavailable.map((i) => i.productId),
          },
          { status: 409 }
        );
      }
    } catch (stockError) {
      console.error("[POST /api/orders] stock check", stockError);
    }

    const orderId = `AM-${Date.now().toString(36).toUpperCase()}`;
    const total = payload.items.reduce(
      (sum, item) => sum + item.priceNum * item.quantity,
      0
    );
    const reference = orderId;
    const prepayUah = await getPrepayAmountUah();
    const amountToPay = paymentType === "prepay" ? prepayUah : total;

    // ---------- Післяплата: без Mono, одразу в Telegram ----------
    if (paymentType === "postpay") {
      const notified = await sendOrderTelegramNotification(payload, orderId, {
        paymentType,
        paymentStatus: "cod",
        amountDue: total,
      });

      try {
        await appendOrder({
          id: orderId,
          createdAt: new Date().toISOString(),
          status: "new",
          customerName: payload.customerName,
          phone: payload.phone,
          email: payload.email,
          deliveryMethod: payload.deliveryMethod,
          city: payload.city,
          address: payload.address,
          comment: payload.comment,
          locale: payload.locale,
          items: payload.items,
          total,
          notified,
          paymentType,
          paymentStatus: "cod",
          paymentReference: reference,
        });
      } catch (storeError) {
        console.error("[POST /api/orders] store", storeError);
      }

      return NextResponse.json({
        ok: true,
        orderId,
        paymentType,
        notified,
      });
    }

    // ---------- Mono: повна / передоплата ----------
    const basketOrder = payload.items.map((item) => {
      const lineTotal = Math.round(item.priceNum * item.quantity * 100);
      return {
        name: item.name.slice(0, 128),
        qty: item.quantity,
        sum: Math.round(item.priceNum * 100),
        total: lineTotal,
        unit: "шт.",
        code: item.productId.slice(0, 64),
      };
    });

    // For prepay, Mono basket is a single deposit line
    const monoBasket =
      paymentType === "prepay"
        ? [
            {
              name: `Передоплата замовлення ${orderId}`,
              qty: 1,
              sum: Math.round(prepayUah * 100),
              total: Math.round(prepayUah * 100),
              unit: "шт.",
              code: "prepay",
            },
          ]
        : basketOrder;

    let invoiceId: string;
    let pageUrl: string;
    try {
      const invoice = await createMonobankInvoice({
        amountInMinorUnits: Math.round(amountToPay * 100),
        currencyCode: 980,
        reference,
        destination:
          paymentType === "prepay"
            ? `Передоплата ${prepayUah} ₴ · ${orderId}`
            : `Оплата замовлення ${orderId}`,
        comment: payload.comment || `Замовлення ${orderId}`,
        basketOrder: monoBasket,
      });
      invoiceId = invoice.invoiceId;
      pageUrl = invoice.pageUrl;
    } catch (monoError) {
      console.error("[POST /api/orders] mono", monoError);
      return NextResponse.json(
        { error: buildMonoFriendlyError(monoError) },
        { status: 502 }
      );
    }

    try {
      await appendOrder({
        id: orderId,
        createdAt: new Date().toISOString(),
        status: "new",
        customerName: payload.customerName,
        phone: payload.phone,
        email: payload.email,
        deliveryMethod: payload.deliveryMethod,
        city: payload.city,
        address: payload.address,
        comment: payload.comment,
        locale: payload.locale,
        items: payload.items,
        total,
        notified: false,
        paymentType,
        paymentStatus: "pending",
        invoiceId,
        paymentReference: reference,
        amountPaid: null,
      });
    } catch (storeError) {
      console.error("[POST /api/orders] store", storeError);
    }

    // Telegram after successful Mono payment (webhook)

    return NextResponse.json({
      ok: true,
      orderId,
      paymentType,
      invoiceId,
      invoiceUrl: pageUrl,
      paymentRef: reference,
      amountToPay,
    });
  } catch (error) {
    console.error("[POST /api/orders]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
