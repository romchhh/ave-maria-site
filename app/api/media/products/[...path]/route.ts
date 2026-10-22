import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRODUCTS_DIR = path.resolve(
  path.join(process.cwd(), "public", "assets", "products")
);

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

/**
 * Serve product uploads from disk so files written at runtime (admin upload)
 * appear immediately — Next static /public can lag until restart.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await context.params;
  if (!parts?.length) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Reject traversal / empty segments
  if (parts.some((p) => !p || p === "." || p === ".." || p.includes("\0"))) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const resolved = path.resolve(PRODUCTS_DIR, ...parts);
  if (
    resolved !== PRODUCTS_DIR &&
    !resolved.startsWith(PRODUCTS_DIR + path.sep)
  ) {
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
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Content-Length": String(buf.byteLength),
      },
    });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
