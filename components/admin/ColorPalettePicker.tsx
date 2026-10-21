"use client";

import React from "react";
import { COLOR_PALETTE } from "@/lib/colorPalette";

type Props = {
  color: string;
  colorHex: string;
  onChange: (next: { color: string; colorHex: string }) => void;
};

export default function ColorPalettePicker({
  color,
  colorHex,
  onChange,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
        {COLOR_PALETTE.map((c) => {
          const active =
            colorHex.toLowerCase() === c.hex.toLowerCase() ||
            color === c.label;
          return (
            <button
              key={c.hex + c.label}
              type="button"
              title={c.label}
              onClick={() => onChange({ color: c.label, colorHex: c.hex })}
              className={`relative aspect-square rounded-full border-2 transition ${
                active
                  ? "border-gray-900 scale-105 dark:border-white"
                  : "border-transparent hover:scale-105"
              }`}
              style={{
                background:
                  c.label === "Мульти"
                    ? "conic-gradient(from 0deg, #e11,#f59,#22c,#06b,#a3e,#e11)"
                    : c.hex,
                boxShadow:
                  c.hex.toLowerCase() === "#f5f5f5" ||
                  c.hex.toLowerCase() === "#ffffff"
                    ? "inset 0 0 0 1px rgba(0,0,0,0.12)"
                    : undefined,
              }}
            />
          );
        })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
            Назва кольору
          </span>
          <input
            className="admin-input"
            value={color}
            onChange={(e) =>
              onChange({ color: e.target.value, colorHex })
            }
            placeholder="Чорний"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
            HEX
          </span>
          <div className="flex gap-2">
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(colorHex) ? colorHex : "#111111"}
              onChange={(e) =>
                onChange({ color, colorHex: e.target.value.toUpperCase() })
              }
              className="h-11 w-14 cursor-pointer rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700"
            />
            <input
              className="admin-input font-mono"
              value={colorHex}
              onChange={(e) =>
                onChange({ color, colorHex: e.target.value })
              }
              placeholder="#111111"
            />
          </div>
        </label>
      </div>
    </div>
  );
}
