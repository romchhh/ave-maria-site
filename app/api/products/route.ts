import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

export const revalidate = 300;

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "Content-Type": "application/json",
    },
  });
}
