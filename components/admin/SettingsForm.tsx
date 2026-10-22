"use client";

import React, { useEffect, useRef, useState } from "react";
import type { SettingKey, SettingsMap } from "@/lib/settingsTypes";
import ImageCropModal, {
  type PendingImageCrop,
} from "@/components/admin/ImageCropModal";
import { loadImageForCrop } from "@/lib/loadImageForCrop";
import { MEDIA } from "@/lib/media";
import { withMediaCacheBust } from "@/lib/mediaUrl";

/** Hero desktop 2400×1600; mobile 1080×1920 (екран ≤1100px) */
const HERO_DESKTOP_ASPECT = 3 / 2;
const HERO_MOBILE_ASPECT = 9 / 16;

type HeroCropTarget = "desktop" | "mobile";

type PendingHeroCrop = {
  pending: PendingImageCrop;
  target: HeroCropTarget;
};

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

const MARKETING_FIELDS: Array<{
  key: SettingKey;
  label: string;
  hint: string;
  placeholder?: string;
}> = [
  {
    key: "gtm_id",
    label: "Google Tag Manager",
    hint: "Контейнер GTM-XXXXXXX. Якщо заповнено — GA4/Ads краще підключати всередині GTM, а не окремими полями нижче.",
    placeholder: "GTM-XXXXXXX",
  },
  {
    key: "google_tag_id",
    label: "Google tag (GA4)",
    hint: "Ідентифікатор потоку GA4 (G-XXXXXXXX). Використовується, якщо GTM порожній.",
    placeholder: "G-XXXXXXXXXX",
  },
  {
    key: "google_ads_id",
    label: "Google Ads",
    hint: "Тег конверсій Google Ads (AW-XXXXXXXXX), якщо не через GTM.",
    placeholder: "AW-XXXXXXXXX",
  },
  {
    key: "meta_pixel_id",
    label: "Meta Pixel ID",
    hint: "Числовий ID пікселя Facebook / Instagram (Events Manager).",
    placeholder: "123456789012345",
  },
  {
    key: "tiktok_pixel_id",
    label: "TikTok Pixel ID",
    hint: "Необовʼязково — ідентифікатор пікселя TikTok Ads.",
    placeholder: "CXXXXXXXXXXXXXXX",
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
    gtm_id: json.values.gtm_id || "",
    google_tag_id: json.values.google_tag_id || "",
    google_ads_id: json.values.google_ads_id || "",
    meta_pixel_id: json.values.meta_pixel_id || "",
    tiktok_pixel_id: json.values.tiktok_pixel_id || "",
    hero_image: json.values.hero_image || "",
    hero_image_mobile: json.values.hero_image_mobile || "",
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
  const [pendingHero, setPendingHero] = useState<PendingHeroCrop | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const heroDesktopInputRef = useRef<HTMLInputElement | null>(null);
  const heroMobileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (pendingHero?.pending.objectUrl) {
        URL.revokeObjectURL(pendingHero.pending.objectUrl);
      }
    };
  }, [pendingHero]);

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

  const pickHeroFile = async (file: File, target: HeroCropTarget) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("img"));
        img.src = objectUrl;
      });
      setPendingHero({
        target,
        pending: {
          file,
          objectUrl,
          naturalW: img.naturalWidth,
          naturalH: img.naturalHeight,
        },
      });
    } catch {
      URL.revokeObjectURL(objectUrl);
      setError("Не вдалося відкрити зображення");
    }
  };

  const recropHero = async (target: HeroCropTarget) => {
    const raw =
      target === "desktop"
        ? draft.hero_image || MEDIA.hero
        : draft.hero_image_mobile || draft.hero_image || MEDIA.hero;
    setError(null);
    try {
      const pending = await loadImageForCrop(raw);
      setPendingHero({ target, pending });
    } catch (e) {
      console.error(e);
      setError("Не вдалося відкрити фото для кадрування");
    }
  };

  const uploadHero = async (
    file: File,
    target: HeroCropTarget,
    crop?: { x: number; y: number; w: number; h: number }
  ) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("images", file);
      fd.append("folder", "hero");
      fd.append("fit", target === "mobile" ? "hero_mobile" : "hero");
      if (crop) fd.append("crop", JSON.stringify(crop));
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        body: fd,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        urls?: string[];
        items?: { url: string }[];
      };
      const url = json.items?.[0]?.url || json.urls?.[0];
      if (!url) throw new Error("empty");
      const key =
        target === "mobile" ? "hero_image_mobile" : "hero_image";
      setDraft((d) => ({ ...d, [key]: url }));
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

  const previewDesktop = withMediaCacheBust(
    draft.hero_image || MEDIA.hero
  );
  const previewMobile = withMediaCacheBust(
    draft.hero_image_mobile || draft.hero_image || MEDIA.hero
  );

  const cropModalProps =
    pendingHero?.target === "mobile"
      ? {
          aspectRatio: HERO_MOBILE_ASPECT,
          title: "Кадр hero — мобільна версія",
          description:
            "Вертикальний кадр для телефонів (екран ≤1100px). Перетягніть і масштабуйте.",
          frameAspectClass: "aspect-[9/16]",
          maxFrameWidthClass: "max-w-[220px]",
        }
      : {
          aspectRatio: HERO_DESKTOP_ASPECT,
          title: "Кадр hero — десктоп",
          description:
            "Широкий кадр для компʼютера та планшетів. Перетягніть і масштабуйте.",
          frameAspectClass: "aspect-[3/2]",
          maxFrameWidthClass: "max-w-[320px]",
        };

  return (
    <>
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
          <HeroPhotoBlock
            label="Фото — десктоп"
            hint="Широкий кадр 3:2, ~2400×1600. Показується на екранах ширших за 1100px."
            previewSrc={previewDesktop}
            hasCustom={Boolean(draft.hero_image)}
            disabled={uploading || saving || Boolean(pendingHero)}
            uploading={uploading}
            onOpenFile={() => heroDesktopInputRef.current?.click()}
            onPickFile={(f) => void pickHeroFile(f, "desktop")}
            fileInputRef={heroDesktopInputRef}
            onRecrop={() => void recropHero("desktop")}
            onReset={() => setDraft((d) => ({ ...d, hero_image: "" }))}
          />
          <HeroPhotoBlock
            label="Фото — мобільна версія"
            hint="Вертикальний кадр 9:16, ~1080×1920. Якщо порожньо — на телефоні використовується десктопне фото."
            previewSrc={previewMobile}
            previewClassName="aspect-[9/16] max-h-[280px] w-auto mx-auto"
            hasCustom={Boolean(draft.hero_image_mobile)}
            disabled={uploading || saving || Boolean(pendingHero)}
            uploading={uploading}
            onOpenFile={() => heroMobileInputRef.current?.click()}
            onPickFile={(f) => void pickHeroFile(f, "mobile")}
            fileInputRef={heroMobileInputRef}
            onRecrop={() => void recropHero("mobile")}
            onReset={() => setDraft((d) => ({ ...d, hero_image_mobile: "" }))}
          />

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

      <section className="admin-panel" data-tour="tour-settings-marketing">
        <div className="admin-panel-head">
          <div>
            <h2 className="admin-panel-title">Аналітика та пікселі</h2>
            <p className="admin-panel-desc">
              Скрипти підключаються на публічному сайті (не в адмінці). Порожнє
              поле — тег вимкнено. Можна дублювати через{" "}
              <code className="text-xs">NEXT_PUBLIC_*</code> у .env.
            </p>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          {MARKETING_FIELDS.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1.5 flex flex-wrap items-center gap-2 text-[13px] font-medium text-gray-700 dark:text-gray-300">
                {field.label}
                {data?.fromEnv[field.key] && !data.values[field.key] && (
                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    з .env
                  </span>
                )}
              </span>
              <input
                className="admin-input font-mono text-sm"
                value={draft[field.key] ?? ""}
                placeholder={field.placeholder}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [field.key]: e.target.value }))
                }
                autoComplete="off"
                spellCheck={false}
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

    {pendingHero && (
      <ImageCropModal
        pending={pendingHero.pending}
        aspectRatio={cropModalProps.aspectRatio}
        title={cropModalProps.title}
        description={cropModalProps.description}
        frameAspectClass={cropModalProps.frameAspectClass}
        maxFrameWidthClass={cropModalProps.maxFrameWidthClass}
        uploading={uploading}
        onCancel={() => {
          URL.revokeObjectURL(pendingHero.pending.objectUrl);
          setPendingHero(null);
        }}
        onConfirm={(crop) => {
          const { file, objectUrl } = pendingHero.pending;
          const target = pendingHero.target;
          void uploadHero(file, target, crop).finally(() => {
            URL.revokeObjectURL(objectUrl);
            setPendingHero(null);
          });
        }}
      />
    )}
    </>
  );
}

function HeroPhotoBlock({
  label,
  hint,
  previewSrc,
  previewClassName = "aspect-[3/2] w-full object-cover",
  hasCustom,
  disabled,
  uploading,
  onOpenFile,
  onPickFile,
  onRecrop,
  onReset,
  fileInputRef,
}: {
  label: string;
  hint: string;
  previewSrc: string;
  previewClassName?: string;
  hasCustom: boolean;
  disabled: boolean;
  uploading: boolean;
  onOpenFile: () => void;
  onPickFile: (file: File) => void;
  onRecrop: () => void;
  onReset: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewSrc} alt="" className={previewClassName} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="admin-btn-secondary"
          disabled={disabled}
          onClick={onOpenFile}
        >
          {uploading ? "Обробка…" : "Завантажити нове"}
        </button>
        <button
          type="button"
          className="admin-btn-secondary"
          disabled={disabled}
          onClick={onRecrop}
        >
          Налаштувати кадр
        </button>
        {hasCustom ? (
          <button
            type="button"
            className="admin-btn-ghost"
            disabled={disabled}
            onClick={onReset}
          >
            Скинути
          </button>
        ) : null}
        <input
          ref={fileInputRef as React.Ref<HTMLInputElement>}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPickFile(f);
            e.target.value = "";
          }}
        />
      </div>
      <span className="mt-1 block text-xs text-gray-400">{hint}</span>
    </div>
  );
}
