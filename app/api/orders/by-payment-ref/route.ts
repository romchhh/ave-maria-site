import { NextRequest, NextResponse } from "next/server";
import { getOrderByPaymentRef } from "@/lib/adminStore";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref")?.trim();
  if (!ref) {
    return NextResponse.json({ error: "ref_required" }, { status: 400 });
  }

  const order = await getOrderByPaymentRef(ref);
  if (!order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    orderId: order.id,
    invoiceId: order.invoiceId ?? null,
    payment_status: order.paymentStatus ?? "pending",
    payment_type: order.paymentType ?? null,
  });
}
