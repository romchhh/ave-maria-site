import { NextRequest, NextResponse } from "next/server";
import { appendOrder } from "@/lib/adminStore";
import { sendOrderTelegramNotification } from "@/lib/orderTelegram";
import type { CheckoutPayload, DeliveryMethod } from "@/lib/types";

export const runtime = "nodejs";

const DELIVERY_METHODS = new Set<DeliveryMethod>([
  "nova_poshta_branch",
  "nova_poshta_locker",
  "nova_poshta_courier",
  "pickup",
  "international",
]);

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

    const payload: CheckoutPayload = {
      customerName: body.customerName.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim() || undefined,
      deliveryMethod: body.deliveryMethod,
      city: body.city.trim(),
      address: body.address.trim(),
      comment: body.comment?.trim() || undefined,
      locale: typeof body.locale === "string" ? body.locale : "uk",
      items: body.items.map((item) => ({
        productId: String(item.productId),
        name: String(item.name),
        size: String(item.size),
        quantity: Math.max(1, Math.floor(Number(item.quantity))),
        priceNum: Number(item.priceNum) || 0,
      })),
    };

    const orderId = `AM-${Date.now().toString(36).toUpperCase()}`;
    const total = payload.items.reduce(
      (sum, item) => sum + item.priceNum * item.quantity,
      0
    );
    const notified = await sendOrderTelegramNotification(payload, orderId);

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
      });
    } catch (storeError) {
      console.error("[POST /api/orders] store", storeError);
    }

    console.log("[POST /api/orders]", {
      orderId,
      notified,
      items: payload.items.length,
      locale: payload.locale,
    });

    return NextResponse.json({ ok: true, orderId, notified });
  } catch (error) {
    console.error("[POST /api/orders]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
