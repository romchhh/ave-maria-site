import type { PendingImageCrop } from "@/components/admin/ImageCropModal";
import { stripMediaQuery } from "@/lib/mediaUrl";

/** Завантажує збережене зображення з сайту для повторного кадрування. */
export async function loadImageForCrop(url: string): Promise<PendingImageCrop> {
  const path = stripMediaQuery(url);
  const res = await fetch(path, { cache: "no-store", credentials: "same-origin" });
  if (!res.ok) throw new Error("fetch_failed");
  const blob = await res.blob();
  const file = new File([blob], "recrop.webp", {
    type: blob.type || "image/webp",
  });
  const objectUrl = URL.createObjectURL(file);
  const img = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("img"));
      img.src = objectUrl;
    });
    return {
      file,
      objectUrl,
      naturalW: img.naturalWidth,
      naturalH: img.naturalHeight,
    };
  } catch (e) {
    URL.revokeObjectURL(objectUrl);
    throw e;
  }
}
