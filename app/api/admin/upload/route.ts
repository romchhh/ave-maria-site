import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { requireAdmin } from "@/lib/adminAuth";
import { withMediaCacheBust } from "@/lib/mediaUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Instagram portrait post ratio 4:5 */
const IG_W = 1080;
const IG_H = 1350;

/** Hero landscape — desktop */
const HERO_W = 2400;
const HERO_H = 1600;

/** Hero portrait — mobile (≤1100px) */
const HERO_MOBILE_W = 1080;
const HERO_MOBILE_H = 1920;

/** Category carousel card — matches .cat-card aspect-ratio 3/4.1 */
const CAT_W = 1080;
const CAT_H = Math.round((CAT_W * 4.1) / 3);

type UploadFolder = "products" | "hero" | "categories";

function resolveFolder(raw: string): UploadFolder {
  if (raw === "hero") return "hero";
  if (raw === "categories") return "categories";
  return "products";
}

function heroOutputSize(fit: string): { w: number; h: number } {
  if (fit === "hero_mobile") return { w: HERO_MOBILE_W, h: HERO_MOBILE_H };
  return { w: HERO_W, h: HERO_H };
}

function cropOutputSize(
  folder: UploadFolder,
  fit: string
): { w: number; h: number } {
  if (folder === "hero") return heroOutputSize(fit);
  if (folder === "categories") return { w: CAT_W, h: CAT_H };
  return { w: IG_W, h: IG_H };
}

type CropPayload = {
  x: number;
  y: number;
  w: number;
  h: number;
};

function parseCrop(raw: FormDataEntryValue | null): CropPayload | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const c = JSON.parse(raw) as CropPayload;
    if (
      typeof c.x === "number" &&
      typeof c.y === "number" &&
      typeof c.w === "number" &&
      typeof c.h === "number" &&
      c.w > 0 &&
      c.h > 0
    ) {
      return c;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const form = await request.formData();
    const files = form
      .getAll("images")
      .filter((f): f is File => f instanceof File);
    if (!files.length) {
      return NextResponse.json({ error: "no_files" }, { status: 400 });
    }

    const folderRaw = String(form.get("folder") || "products").toLowerCase();
    const folder = resolveFolder(folderRaw);
    const crop = parseCrop(form.get("crop"));
    const fitParam = String(form.get("fit") || "");
    const fitIg =
      folder === "products" &&
      (fitParam === "instagram" || Boolean(crop));
    const fitHeroMobile =
      folder === "hero" && fitParam === "hero_mobile";
    const fitHeroDesktop =
      folder === "hero" &&
      (fitParam === "hero" || (!fitParam && !fitHeroMobile));
    const fitCategory =
      folder === "categories" || fitParam === "category";

    const dir = path.join(process.cwd(), "public", "assets", folder);
    await fs.mkdir(dir, { recursive: true });

    const stamp = Date.now();
    const items: Array<{
      url: string;
      type: "image" | "video";
      width?: number;
      height?: number;
    }> = [];

    for (const file of files) {
      const buf = Buffer.from(await file.arrayBuffer());
      const base = `${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const isVideo = file.type.startsWith("video/");

      if (isVideo) {
        if (folder === "hero") {
          return NextResponse.json(
            { error: "hero_video_not_supported" },
            { status: 400 }
          );
        }
        const ext =
          file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
          "mp4";
        const filename = `${base}.${ext}`;
        const outPath = path.join(dir, filename);
        await fs.writeFile(outPath, buf);
        items.push({
          url: withMediaCacheBust(`/assets/${folder}/${filename}`, stamp),
          type: "video",
        });
        continue;
      }

      let pipeline = sharp(buf).rotate();
      const meta = await pipeline.metadata();
      const srcW = meta.width || IG_W;
      const srcH = meta.height || IG_H;

      if (
        crop &&
        (folder === "products" || folder === "hero" || folder === "categories")
      ) {
        const left = Math.max(0, Math.round(crop.x * srcW));
        const top = Math.max(0, Math.round(crop.y * srcH));
        const width = Math.min(srcW - left, Math.round(crop.w * srcW));
        const height = Math.min(srcH - top, Math.round(crop.h * srcH));
        const { w: outW, h: outH } = cropOutputSize(folder, fitParam);
        pipeline = sharp(buf)
          .rotate()
          .extract({
            left,
            top,
            width: Math.max(1, width),
            height: Math.max(1, height),
          })
          .resize(outW, outH, { fit: "fill" });
      } else if (fitIg) {
        pipeline = sharp(buf)
          .rotate()
          .resize(IG_W, IG_H, { fit: "cover", position: "centre" });
      } else if (fitHeroMobile) {
        pipeline = sharp(buf)
          .rotate()
          .resize(HERO_MOBILE_W, HERO_MOBILE_H, {
            fit: "cover",
            position: "centre",
            kernel: sharp.kernel.lanczos3,
          });
      } else if (fitHeroDesktop) {
        pipeline = sharp(buf)
          .rotate()
          .resize(HERO_W, HERO_H, {
            fit: "cover",
            position: "centre",
            kernel: sharp.kernel.lanczos3,
          });
      } else if (fitCategory) {
        pipeline = sharp(buf)
          .rotate()
          .resize(CAT_W, CAT_H, {
            fit: "cover",
            position: "centre",
            kernel: sharp.kernel.lanczos3,
          });
      } else {
        pipeline = sharp(buf)
          .rotate()
          .resize({ width: 1600, withoutEnlargement: true });
      }

      const filename = `${base}.webp`;
      const outPath = path.join(dir, filename);
      const webpQ =
        fitHeroDesktop || fitHeroMobile ? 94 : fitCategory ? 88 : 84;
      const info = await pipeline.webp({ quality: webpQ, effort: 6 }).toFile(outPath);
      await fs.access(outPath);

      items.push({
        url: withMediaCacheBust(`/assets/${folder}/${filename}`, stamp),
        type: "image",
        width: info.width,
        height: info.height,
      });
    }

    return NextResponse.json(
      {
        urls: items.map((i) => i.url),
        items,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[POST /api/admin/upload]", error);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
