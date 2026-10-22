import { NextResponse } from "next/server";
import { buildLlmsTxt } from "@/lib/llms";
import { getSiteUrl } from "@/lib/i18n/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const body = buildLlmsTxt(getSiteUrl());
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
