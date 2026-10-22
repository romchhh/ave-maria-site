"use client";

import React, { useRef, useState } from "react";
import ImageCropModal, {
  type PendingImageCrop,
} from "@/components/admin/ImageCropModal";
import { loadImageForCrop } from "@/lib/loadImageForCrop";
import {
  HERO_DESKTOP_ASPECT,
  HERO_MOBILE_ASPECT,
  type HeroFraming,
  heroFramingToImgStyle,
  parseHeroFraming,
  serializeHeroFraming,
} from "@/lib/heroFrame";
import { MEDIA } from "@/lib/media";
import { withMediaCacheBust } from "@/lib/mediaUrl";

type Target = "desktop" | "mobile";

type Pending = {
  pending: PendingImageCrop;
  target: Target;
  initialFraming: HeroFraming | null;
  chainMobileAfterDesktop?: boolean;
};

type Props = {
  imageUrl: string;
  frameDesktopJson: string;
  frameMobileJson: string;
  disabled?: boolean;
  onChange: (patch: {
    hero_image?: string;
    hero_frame_desktop?: string;
    hero_frame_mobile?: string;
  }) => void;
};

export default function HeroImageEditor({
  imageUrl,
  frameDesktopJson,
  frameMobileJson,
  disabled,
  onChange,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const source = imageUrl || MEDIA.hero;
  const src = withMediaCacheBust(source);
  const frameDesktop = parseHeroFraming(frameDesktopJson);
  const frameMobile = parseHeroFraming(frameMobileJson);

  const openFraming = async (
    target: Target,
    opts?: { chainMobileAfterDesktop?: boolean; file?: File }
  ) => {
    setLocalError(null);
    try {
      let cropPending: PendingImageCrop;
      if (opts?.file) {
        const objectUrl = URL.createObjectURL(opts.file);
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("img"));
          img.src = objectUrl;
        });
        cropPending = {
          file: opts.file,
          objectUrl,
          naturalW: img.naturalWidth,
          naturalH: img.naturalHeight,
        };
      } else {
        cropPending = await loadImageForCrop(source);
      }
      const initialFraming =
        target === "desktop" ? frameDesktop : frameMobile;
      setPending({
        pending: cropPending,
        target,
        initialFraming,
        chainMobileAfterDesktop: opts?.chainMobileAfterDesktop,
      });
    } catch (e) {
      console.error(e);
      setLocalError("Не вдалося відкрити фото");
    }
  };

  const uploadSource = async (file: File) => {
    setUploading(true);
    setLocalError(null);
    try {
      const fd = new FormData();
      fd.append("images", file);
      fd.append("folder", "hero");
      fd.append("fit", "hero_source");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        body: fd,
      });
      if (!res.ok) throw new Error("upload");
      const json = (await res.json()) as {
        urls?: string[];
        items?: { url: string }[];
      };
      const url = json.items?.[0]?.url || json.urls?.[0];
      if (!url) throw new Error("empty");
      onChange({
        hero_image: url,
        hero_frame_desktop: "",
        hero_frame_mobile: "",
      });
      return url;
    } catch (e) {
      console.error(e);
      setLocalError("Не вдалося завантажити фото");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onPickFile = async (file: File) => {
    await uploadSource(file);
    await openFraming("desktop", { chainMobileAfterDesktop: true, file });
  };

  const saveFraming = (target: Target, framing: HeroFraming) => {
    const key =
      target === "desktop" ? "hero_frame_desktop" : "hero_frame_mobile";
    onChange({ [key]: serializeHeroFraming(framing) });
  };

  const modalCfg =
    pending?.target === "mobile"
      ? {
          aspectRatio: HERO_MOBILE_ASPECT,
          title: "Кадр для телефону",
          description:
            "Те саме фото, інший кадр для екранів до 1100px. Файл не обрізається — лише зона показу.",
          frameAspectClass: "aspect-[9/16]",
          maxFrameWidthClass: "max-w-[240px]",
        }
      : {
          aspectRatio: HERO_DESKTOP_ASPECT,
          title: "Кадр для компʼютера",
          description:
            "Те саме фото для широких екранів. Перетягніть і масштабуйте — оригінал залишається повним.",
          frameAspectClass: "aspect-[3/2]",
          maxFrameWidthClass: "max-w-[360px]",
        };

  return (
    <div className="space-y-4">
      {localError && (
        <p className="text-sm text-red-600 dark:text-red-400">{localError}</p>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Одне фото на диску. Окремо налаштовуєте, яку частину показувати на
        компʼютері та на телефоні — без повторного завантаження та без
        «вирізання» файлу.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <FramePreview
          label="Попередній перегляд — десктоп"
          src={src}
          aspectClass="aspect-[3/2]"
          style={heroFramingToImgStyle(frameDesktop)}
          onEdit={() => void openFraming("desktop")}
          disabled={disabled || uploading || Boolean(pending)}
        />
        <FramePreview
          label="Попередній перегляд — мобільний"
          src={src}
          aspectClass="aspect-[9/16] max-w-[200px] mx-auto w-full"
          style={heroFramingToImgStyle(frameMobile ?? frameDesktop)}
          onEdit={() => void openFraming("mobile")}
          disabled={disabled || uploading || Boolean(pending)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="admin-btn-primary"
          disabled={disabled || uploading || Boolean(pending)}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "Завантаження…" : "Завантажити фото"}
        </button>
        <button
          type="button"
          className="admin-btn-secondary"
          disabled={disabled || uploading || Boolean(pending)}
          onClick={() => void openFraming("desktop")}
        >
          Кадр — десктоп
        </button>
        <button
          type="button"
          className="admin-btn-secondary"
          disabled={disabled || uploading || Boolean(pending)}
          onClick={() => void openFraming("mobile")}
        >
          Кадр — мобільний
        </button>
        {imageUrl ? (
          <button
            type="button"
            className="admin-btn-ghost"
            disabled={disabled || uploading}
            onClick={() =>
              onChange({
                hero_image: "",
                hero_frame_desktop: "",
                hero_frame_mobile: "",
              })
            }
          >
            Скинути фото
          </button>
        ) : null}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onPickFile(f);
          e.target.value = "";
        }}
      />

      {pending && (
        <ImageCropModal
          pending={pending.pending}
          aspectRatio={modalCfg.aspectRatio}
          title={modalCfg.title}
          description={modalCfg.description}
          frameAspectClass={modalCfg.frameAspectClass}
          maxFrameWidthClass={modalCfg.maxFrameWidthClass}
          initialOffset={
            pending.initialFraming
              ? {
                  x: pending.initialFraming.offsetX,
                  y: pending.initialFraming.offsetY,
                }
              : undefined
          }
          initialZoom={pending.initialFraming?.zoom}
          onCancel={() => {
            URL.revokeObjectURL(pending.pending.objectUrl);
            setPending(null);
          }}
          onConfirm={(framing) => {
            const { target, chainMobileAfterDesktop } = pending;
            const { objectUrl, file, naturalW, naturalH } = pending.pending;
            saveFraming(target, framing);

            if (target === "desktop" && chainMobileAfterDesktop) {
              setPending({
                pending: {
                  file,
                  objectUrl,
                  naturalW,
                  naturalH,
                },
                target: "mobile",
                initialFraming: frameMobile,
              });
              return;
            }

            URL.revokeObjectURL(objectUrl);
            setPending(null);
          }}
        />
      )}
    </div>
  );
}

function FramePreview({
  label,
  src,
  aspectClass,
  style,
  onEdit,
  disabled,
}: {
  label: string;
  src: string;
  aspectClass: string;
  style: React.CSSProperties;
  onEdit: () => void;
  disabled: boolean;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <div
        className={`relative overflow-hidden rounded-xl border border-gray-200 bg-gray-900/5 dark:border-gray-700 ${aspectClass}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={style}
        />
      </div>
      <button
        type="button"
        className="admin-btn-ghost mt-2 text-xs"
        disabled={disabled}
        onClick={onEdit}
      >
        Налаштувати кадр
      </button>
    </div>
  );
}
