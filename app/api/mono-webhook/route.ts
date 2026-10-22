import { NextRequest, NextResponse } from "next/server";
import {
  getOrderByInvoiceId,
  updateOrder,
  updatePaymentStatus,
} from "@/lib/adminStore";
import { sendOrderTelegramNotification } from "@/lib/orderTelegram";
import type { CheckoutPayload } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as {
      invoiceId?: string;
      status?: string;
      amount?: number;
      ccy?: number;
    };

    const { invoiceId, status, amount } = data;
    console.log("[mono-webhook]", { invoiceId, status, amount });

    if (!invoiceId || !status) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (status !== "success") {
      if (status === "failure" || status === "expired" || status === "rejected") {
        await updatePaymentStatus(invoiceId, "canceled");
      }
      return NextResponse.json({ success: true });
    }

    const amountPaid =
      typeof amount === "number" && Number.isFinite(amount)
        ? amount / 100
        : undefined;

    const order = await updatePaymentStatus(invoiceId, "paid", amountPaid);
    if (!order) {
      console.warn("[mono-webhook] order not found for invoice", invoiceId);
      return NextResponse.json({ success: true });
    }

    if (!order.notified) {
      const payload: CheckoutPayload = {
        customerName: order.customerName,
        phone: order.phone,
        email: order.email,
        deliveryMethod: order.deliveryMethod,
        city: order.city,
        address: order.address,
        comment: order.comment,
        locale: order.locale,
        paymentType: order.paymentType,
        items: order.items,
      };

      const notified = await sendOrderTelegramNotification(payload, order.id, {
        paymentType: order.paymentType,
        paymentStatus: "paid",
        amountPaid: amountPaid ?? order.amountPaid ?? undefined,
        invoiceId,
      });

      if (notified) {
        await updateOrder(order.id, { notified: true });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[mono-webhook]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
