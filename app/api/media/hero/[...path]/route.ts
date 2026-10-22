import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HERO_DIR = path.resolve(
  path.join(process.cwd(), "public", "assets", "hero")
);

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await context.params;
  if (!parts?.length) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (parts.some((p) => !p || p === "." || p === ".." || p.includes("\0"))) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const resolved = path.resolve(HERO_DIR, ...parts);
  if (resolved !== HERO_DIR && !resolved.startsWith(HERO_DIR + path.sep)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  try {
    const buf = await fs.readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
        "Content-Length": String(buf.byteLength),
      },
    });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
