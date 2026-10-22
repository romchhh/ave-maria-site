"use client";

import React, { useEffect, useRef, useState } from "react";
import type { SettingKey, SettingsMap } from "@/lib/settingsTypes";
import { MEDIA } from "@/lib/media";
import { withMediaCacheBust } from "@/lib/mediaUrl";

type AdminSettingsResponse = {
  values: SettingsMap;
  masked: Partial<Record<SettingKey, string>>;
  fromEnv: Partial<Record<SettingKey, boolean>>;
};

const INTEGRATION_FIELDS: Array<{
  key: SettingKey;
  label: string;
  hint: string;
  secret?: boolean;
  placeholder?: string;
}> = [
  {
    key: "telegram_bot_token",
    label: "Telegram Bot Token",
    hint: "Токен бота від @BotFather — сповіщення про замовлення",
    secret: true,
    placeholder: "123456:ABC…",
  },
  {
    key: "telegram_chat_id",
    label: "Telegram Chat ID",
    hint: "ID чату або каналу, куди надсилати замовлення",
    placeholder: "-100…",
  },
  {
    key: "nova_poshta_api_key",
    label: "Нова Пошта API Key",
    hint: "Ключ з my.novaposhta.ua — підвищує ліміти адресного API",
    secret: true,
    placeholder: "xxxxxxxx…",
  },
  {
    key: "site_url",
    label: "URL сайту",
    hint: "Публічна адреса (для фідів і канонічних посилань). Напр. https://avemariabeautylab.com",
    placeholder: "https://avemariabeautylab.com",
  },
];

const HERO_DEFAULTS = {
  hero_title: "AVE MARIA",
  hero_eyebrow: "Мультибренд · beauty lab",
  hero_lead:
    "Твоя щоденна розкіш. Hair, skin, body, face — догляд і аромати для кожного дня.",
  hero_cta: "Каталог",
};

function draftFromResponse(json: AdminSettingsResponse): Partial<SettingsMap> {
  return {
    telegram_bot_token: json.masked.telegram_bot_token || "",
    telegram_chat_id: json.values.telegram_chat_id || "",
    nova_poshta_api_key: json.masked.nova_poshta_api_key || "",
    site_url: json.values.site_url || "",
    hero_image: json.values.hero_image || "",
    hero_title: json.values.hero_title || "",
    hero_eyebrow: json.values.hero_eyebrow || "",
    hero_lead: json.values.hero_lead || "",
    hero_cta: json.values.hero_cta || "",
  };
}

export default function SettingsForm() {
  const [data, setData] = useState<AdminSettingsResponse | null>(null);
  const [draft, setDraft] = useState<Partial<SettingsMap>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AdminSettingsResponse;
      setData(json);
      setDraft(draftFromResponse(json));
    } catch (e) {
      console.error(e);
      setError("Не вдалося завантажити налаштування");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AdminSettingsResponse;
      setData(json);
      setDraft(draftFromResponse(json));
      setMessage("Збережено — зміни на головній зʼявляться одразу");
    } catch (err) {
      console.error(err);
      setError("Не вдалося зберегти");
    } finally {
      setSaving(false);
    }
  };

  const uploadHero = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("images", file);
      fd.append("folder", "hero");
      fd.append("fit", "hero");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        body: fd,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { urls?: string[]; items?: { url: string }[] };
      const url = json.items?.[0]?.url || json.urls?.[0];
      if (!url) throw new Error("empty");
      setDraft((d) => ({ ...d, hero_image: url }));
      setMessage("Фото завантажено — натисніть «Зберегти», щоб опублікувати");
    } catch (err) {
      console.error(err);
      setError("Не вдалося завантажити фото hero");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-panel px-5 py-8 text-sm text-gray-500">
        Завантаження…
      </div>
    );
  }

  const previewSrc = draft.hero_image
    ? withMediaCacheBust(draft.hero_image)
    : MEDIA.hero;

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-[#C9B59A]/40 bg-[#C9B59A]/15 px-4 py-3 text-sm text-gray-800 dark:text-[#C9B59A]">
          {message}
        </div>
      )}

      <section className="admin-panel" data-tour="tour-settings-hero">
        <div className="admin-panel-head">
          <div>
            <h2 className="admin-panel-title">Hero на головній</h2>
            <p className="admin-panel-desc">
              Фото та тексти першого екрана. Порожнє поле = значення за
              замовчуванням з сайту.
            </p>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
              Фото
            </span>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt=""
                className="aspect-[3/2] w-full object-cover"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={uploading || saving}
                onClick={() => heroInputRef.current?.click()}
              >
                {uploading ? "Завантаження…" : "Змінити фото"}
              </button>
              {draft.hero_image ? (
                <button
                  type="button"
                  className="admin-btn-ghost"
                  disabled={uploading || saving}
                  onClick={() => setDraft((d) => ({ ...d, hero_image: "" }))}
                >
                  Скинути на дефолт
                </button>
              ) : null}
              <input
                ref={heroInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadHero(f);
                  e.target.value = "";
                }}
              />
            </div>
            <span className="mt-1 block text-xs text-gray-400">
              Рекомендовано широкий кадр (~2400×1600). Зберігається як WebP.
            </span>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
              Великий заголовок
            </span>
            <input
              className="admin-input"
              value={draft.hero_title ?? ""}
              placeholder={HERO_DEFAULTS.hero_title}
              onChange={(e) =>
                setDraft((d) => ({ ...d, hero_title: e.target.value }))
              }
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
              Підзаголовок (eyebrow)
            </span>
            <input
              className="admin-input"
              value={draft.hero_eyebrow ?? ""}
              placeholder={HERO_DEFAULTS.hero_eyebrow}
              onChange={(e) =>
                setDraft((d) => ({ ...d, hero_eyebrow: e.target.value }))
              }
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
              Опис
            </span>
            <textarea
              className="admin-input min-h-[88px] resize-y"
              value={draft.hero_lead ?? ""}
              placeholder={HERO_DEFAULTS.hero_lead}
              onChange={(e) =>
                setDraft((d) => ({ ...d, hero_lead: e.target.value }))
              }
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
              Текст кнопки
            </span>
            <input
              className="admin-input"
              value={draft.hero_cta ?? ""}
              placeholder={HERO_DEFAULTS.hero_cta}
              onChange={(e) =>
                setDraft((d) => ({ ...d, hero_cta: e.target.value }))
              }
            />
          </label>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2 className="admin-panel-title">Інтеграції</h2>
            <p className="admin-panel-desc">
              Значення з адмінки мають пріоритет над `.env`. Секрети показуються
              замасковано — вставте новий ключ повністю, щоб замінити.
            </p>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          {INTEGRATION_FIELDS.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1.5 flex flex-wrap items-center gap-2 text-[13px] font-medium text-gray-700 dark:text-gray-300">
                {field.label}
                {data?.fromEnv[field.key] && !data.values[field.key] && (
                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    з .env
                  </span>
                )}
                {data?.values[field.key] && (
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                    збережено
                  </span>
                )}
              </span>
              <input
                className="admin-input font-mono text-[13px]"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={draft[field.key] ?? ""}
                placeholder={field.placeholder}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [field.key]: e.target.value }))
                }
                onFocus={() => {
                  if (
                    field.secret &&
                    (draft[field.key] || "").includes("••••")
                  ) {
                    setDraft((d) => ({ ...d, [field.key]: "" }));
                  }
                }}
              />
              <span className="mt-1 block text-xs text-gray-400">
                {field.hint}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2 className="admin-panel-title">Доступ до адмінки</h2>
            <p className="admin-panel-desc">
              Логін і пароль задаються лише в{" "}
              <code className="text-xs">.env.local</code> (
              <code className="text-xs">ADMIN_USER</code> /{" "}
              <code className="text-xs">ADMIN_PASS</code>) і не редагуються тут
              з міркувань безпеки.
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="admin-btn-secondary"
          onClick={() => void load()}
          disabled={saving || uploading}
        >
          Скинути
        </button>
        <button
          type="submit"
          className="admin-btn-primary"
          disabled={saving || uploading}
        >
          {saving ? "Збереження…" : "Зберегти"}
        </button>
      </div>
    </form>
  );
}
