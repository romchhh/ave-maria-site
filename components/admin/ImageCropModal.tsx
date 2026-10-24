"use client";

import React, { useRef, useState } from "react";
import { buildHeroFraming, type HeroFraming } from "@/lib/heroFrame";
import { computeNormalizedCrop } from "@/lib/imageCrop";

export type PendingImageCrop = {
  file: File;
  objectUrl: string;
  naturalW: number;
  naturalH: number;
};

type Props = {
  pending: PendingImageCrop;
  aspectRatio: number;
  title: string;
  description: string;
  /** Tailwind aspect class for preview frame, e.g. aspect-[3/2] */
  frameAspectClass: string;
  maxFrameWidthClass?: string;
  allowZoom?: boolean;
  uploading?: boolean;
  initialOffset?: { x: number; y: number };
  initialZoom?: number;
  onCancel: () => void;
  onConfirm: (framing: HeroFraming) => void;
};

export default function ImageCropModal({
  pending,
  aspectRatio,
  title,
  description,
  frameAspectClass,
  maxFrameWidthClass = "max-w-[320px]",
  allowZoom = true,
  uploading = false,
  initialOffset,
  initialZoom,
  onCancel,
  onConfirm,
}: Props) {
  const [offset, setOffset] = useState(
    initialOffset ?? { x: 0.5, y: 0.5 }
  );
  const [zoom, setZoom] = useState(initialZoom ?? 1);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    ox: number;
    oy: number;
  } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const confirm = () => {
    const crop = computeNormalizedCrop(
      pending.naturalW,
      pending.naturalH,
      aspectRatio,
      offset,
      zoom
    );
    onConfirm(buildHeroFraming(crop, offset, zoom));
  };

  const dragSensitivity = () => {
    const w = frameRef.current?.clientWidth ?? 280;
    const h = frameRef.current?.clientHeight ?? w / aspectRatio;
    return { w, h };
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h4>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        <div
          ref={frameRef}
          className={`relative mx-auto mt-4 ${frameAspectClass} w-full ${maxFrameWidthClass} cursor-grab overflow-hidden rounded-xl border border-gray-200 bg-white active:cursor-grabbing dark:border-gray-700 dark:bg-gray-900`}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            dragRef.current = {
              startX: e.clientX,
              startY: e.clientY,
              ox: offset.x,
              oy: offset.y,
            };
          }}
          onPointerMove={(e) => {
            if (!dragRef.current) return;
            const { w, h } = dragSensitivity();
            const dx = (e.clientX - dragRef.current.startX) / w;
            const dy = (e.clientY - dragRef.current.startY) / h;
            setOffset({
              x: Math.min(1, Math.max(0, dragRef.current.ox - dx)),
              y: Math.min(1, Math.max(0, dragRef.current.oy - dy)),
            });
          }}
          onPointerUp={() => {
            dragRef.current = null;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pending.objectUrl}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
            style={{
              objectPosition: `${offset.x * 100}% ${offset.y * 100}%`,
              transform: `scale(${zoom})`,
              transformOrigin: `${offset.x * 100}% ${offset.y * 100}%`,
            }}
          />
          <div className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-[#C9B59A]" />
        </div>
        {allowZoom ? (
          <label className="mt-4 block">
            <span className="mb-1.5 flex justify-between text-xs text-gray-500">
              <span>Масштаб</span>
              <span>{zoom.toFixed(1)}×</span>
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#C9B59A]"
            />
          </label>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="admin-btn-secondary" onClick={onCancel}>
            Скасувати
          </button>
          <button
            type="button"
            className="admin-btn-primary"
            disabled={uploading}
            onClick={confirm}
          >
            {uploading ? "Обробка…" : "Зберегти кадр"}
          </button>
        </div>
      </div>
    </div>
  );
}
