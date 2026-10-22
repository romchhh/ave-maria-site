import { NextResponse } from "next/server";
import { buildMetaCatalogXml } from "@/lib/feeds";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  const xml = await buildMetaCatalogXml();
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
