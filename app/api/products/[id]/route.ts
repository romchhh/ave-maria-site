import { NextResponse } from "next/server";
import { getProductById } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product, {
    headers: {
      "Cache-Control": "no-store, must-revalidate",
      "Content-Type": "application/json",
    },
  });
}
