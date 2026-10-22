import { NextResponse } from "next/server";
import { getVisibleProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await getVisibleProducts();
  return NextResponse.json(products, {
    headers: {
      "Cache-Control": "no-store, must-revalidate",
      "Content-Type": "application/json",
    },
  });
}
