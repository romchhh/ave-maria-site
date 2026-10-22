import { NextRequest, NextResponse } from "next/server";
import { getOrderByInvoiceId } from "@/lib/adminStore";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId: raw } = await params;
  const invoiceId = decodeURIComponent(raw || "").trim();
  if (!invoiceId) {
    return NextResponse.json({ error: "invoice_required" }, { status: 400 });
  }

  const order = await getOrderByInvoiceId(invoiceId);
  if (!order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    orderId: order.id,
    invoiceId: order.invoiceId,
    payment_status: order.paymentStatus ?? "pending",
    payment_type: order.paymentType ?? null,
    total: order.total,
  });
}
