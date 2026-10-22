"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ImageCropModal, {
  type PendingImageCrop,
} from "@/components/admin/ImageCropModal";
import type { ProductMedia } from "@/lib/types";
import { withMediaCacheBust } from "@/lib/mediaUrl";

/** Instagram post portrait 4:5 */
const RATIO = 4 / 5;

type Props = {
  media: ProductMedia[];
  onChange: (media: ProductMedia[]) => void;
};

export default function ProductMediaManager({ media, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingImageCrop | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef(media);
  mediaRef.current = media;

  useEffect(() => {
    return () => {
      if (pending?.objectUrl) URL.revokeObjectURL(pending.objectUrl);
    };
  }, [pending]);

  const uploadProcessed = useCallback(
    async (file: File, crop?: { x: number; y: number; w: number; h: number }) => {
      setUploading(true);
      setError(null);
      try {
        const fd = new FormData();
        fd.append("images", file);
        fd.append("fit", "instagram");
        if (crop) fd.append("crop", JSON.stringify(crop));
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          body: fd,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          items?: ProductMedia[];
          urls?: string[];
        };
        const stamp = Date.now();
        const items: ProductMedia[] =
          data.items?.map((i) => ({
            url: withMediaCacheBust(i.url, stamp),
            type: i.type === "video" ? "video" : "image",
            width: i.width,
            height: i.height,
          })) ??
          (data.urls || []).map((url) => ({
            url: withMediaCacheBust(url, stamp),
            type: "image" as const,
          }));
        if (!items.length) throw new Error("empty");
        onChange([...mediaRef.current, ...items]);
      } catch (e) {
        console.error(e);
        setError("Не вдалося завантажити медіа");
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const onPickFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    for (const file of list) {
      if (file.type.startsWith("video/")) {
        await uploadProcessed(file);
        continue;
      }
      if (!file.type.startsWith("image/")) continue;

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("img"));
        img.src = objectUrl;
      });
      setPending({
        file,
        objectUrl,
        naturalW: img.naturalWidth,
        naturalH: img.naturalHeight,
      });
      return; // one at a time for crop UI
    }
  };

  const removeAt = (idx: number) => {
    onChange(media.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const t = idx + dir;
    if (t < 0 || t >= media.length) return;
    const next = [...media];
    [next[idx], next[t]] = [next[t], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
            Фото та відео
          </h3>
          <p className="mt-0.5 text-sm text-gray-500">
            Формат Instagram Post 4:5 (1080×1350). При додаванні фото можна
            налаштувати кадр.
          </p>
        </div>
        <button
          type="button"
          className="admin-btn-secondary"
          disabled={uploading || Boolean(pending)}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Обробка…" : "Додати медіа"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void onPickFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {media.map((m, idx) => (
          <div
            key={`${m.url}-${idx}`}
            className="group overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03]"
          >
            <div className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-800">
              {m.type === "video" ? (
                <video
                  src={m.url}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (el.dataset.retried) return;
                    el.dataset.retried = "1";
                    el.src = withMediaCacheBust(m.url, Date.now());
                  }}
                />
              )}
              {idx === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-[#C9B59A] px-2 py-0.5 text-[10px] font-semibold text-[#111]">
                  Головне
                </span>
              )}
              <span className="absolute bottom-2 left-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
                {m.type === "video" ? "VIDEO" : "4:5"}
                {m.width && m.height ? ` · ${m.width}×${m.height}` : ""}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 p-2">
              <div className="flex gap-1">
                <button
                  type="button"
                  className="admin-btn-ghost !px-2"
                  disabled={idx === 0}
                  onClick={() => move(idx, -1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="admin-btn-ghost !px-2"
                  disabled={idx === media.length - 1}
                  onClick={() => move(idx, 1)}
                >
                  →
                </button>
              </div>
              <button
                type="button"
                className="admin-btn-ghost text-red-600 dark:text-red-400"
                onClick={() => removeAt(idx)}
              >
                Видалити
              </button>
            </div>
          </div>
        ))}

        {!media.length && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[4/5] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-400 transition hover:border-gray-500 hover:text-gray-600 dark:border-gray-600"
          >
            + Додати
          </button>
        )}
      </div>

      {pending && (
        <ImageCropModal
          pending={pending}
          aspectRatio={RATIO}
          title="Кадр Instagram 4:5"
          description="Перетягніть зображення та змініть масштаб, щоб обрати зону обрізки."
          frameAspectClass="aspect-[4/5]"
          maxFrameWidthClass="max-w-[280px]"
          uploading={uploading}
          onCancel={() => {
            URL.revokeObjectURL(pending.objectUrl);
            setPending(null);
          }}
          onConfirm={(crop) => {
            const { file, objectUrl } = pending;
            void uploadProcessed(file, crop).finally(() => {
              URL.revokeObjectURL(objectUrl);
              setPending(null);
            });
          }}
        />
      )}
    </div>
  );
}
