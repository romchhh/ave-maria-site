"use client";

import React, { useEffect, useState } from "react";
import HeroImageEditor from "@/components/admin/HeroImageEditor";
import type { SettingKey, SettingsMap } from "@/lib/settingsTypes";

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
    mono_token: json.masked.mono_token || "",
    prepay_amount_uah: json.values.prepay_amount_uah || "300",
    gtm_id: json.values.gtm_id || "",
    google_tag_id: json.values.google_tag_id || "",
    google_ads_id: json.values.google_ads_id || "",
    meta_pixel_id: json.values.meta_pixel_id || "",
    tiktok_pixel_id: json.values.tiktok_pixel_id || "",
    hero_image: json.values.hero_image || "",
    hero_frame_desktop: json.values.hero_frame_desktop || "",
    hero_frame_mobile: json.values.hero_frame_mobile || "",
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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="admin-panel px-5 py-8 text-sm text-gray-500">
        Завантаження…
      </div>
    );
  }

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
          <HeroImageEditor
            imageUrl={draft.hero_image ?? ""}
            frameDesktopJson={draft.hero_frame_desktop ?? ""}
            frameMobileJson={draft.hero_frame_mobile ?? ""}
            disabled={saving}
            onChange={(patch) => {
              setDraft((d) => ({ ...d, ...patch }));
              setMessage(
                "Зміни hero застосуються на сайті після «Зберегти»"
              );
            }}
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

      <section className="admin-panel" data-tour="tour-settings-payments">
        <div className="admin-panel-head">
          <div>
            <h2 className="admin-panel-title">Оплата · Monobank</h2>
            <p className="admin-panel-desc">
              Plata by mono для повної оплати та передоплати. Webhook і
              повернення після оплати беруть{" "}
              <strong className="font-medium text-gray-600 dark:text-gray-300">
                URL сайту
              </strong>{" "}
              з блоку «Інтеграції» нижче — окремо домен вказувати не треба.
            </p>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <label className="block">
            <span className="mb-1.5 flex flex-wrap items-center gap-2 text-[13px] font-medium text-gray-700 dark:text-gray-300">
              Токен еквайрингу (X-Token)
              {data?.fromEnv.mono_token && !data.values.mono_token && (
                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  з .env
                </span>
              )}
              {data?.values.mono_token && (
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
              value={draft.mono_token ?? ""}
              placeholder="Токен з web.monobank.ua → Інтернет-еквайринг"
              onChange={(e) =>
                setDraft((d) => ({ ...d, mono_token: e.target.value }))
              }
              onFocus={() => {
                if ((draft.mono_token || "").includes("••••")) {
                  setDraft((d) => ({ ...d, mono_token: "" }));
                }
              }}
            />
            <span className="mt-1 block text-xs text-gray-400">
              Секрет показується замасковано. Щоб замінити — вставте новий токен
              повністю.
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-end">
            <label className="block">
              <span className="mb-1.5 flex flex-wrap items-center gap-2 text-[13px] font-medium text-gray-700 dark:text-gray-300">
                Сума передоплати
                {data?.fromEnv.prepay_amount_uah &&
                  !data.values.prepay_amount_uah && (
                    <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      з .env
                    </span>
                  )}
              </span>
              <div className="relative">
                <input
                  className="admin-input pr-10 tabular-nums"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={draft.prepay_amount_uah ?? "300"}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      prepay_amount_uah: e.target.value,
                    }))
                  }
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  ₴
                </span>
              </div>
            </label>
            <p className="text-xs leading-relaxed text-gray-400 sm:pb-2.5">
              Скільки клієнт платить онлайн при виборі «Передоплата». Решту —
              при отриманні. За замовчуванням 300 ₴.
            </p>
          </div>

          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-3 py-2.5 text-xs text-gray-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
            <div className="font-medium text-gray-600 dark:text-gray-300">
              Webhook Monobank (автоматично)
            </div>
            {(() => {
              const base = (draft.site_url || data?.values.site_url || "")
                .trim()
                .replace(/\/$/, "");
              return base ? (
                <code className="mt-1 block break-all text-[11px]">
                  {base}/api/mono-webhook
                </code>
              ) : (
                <span className="mt-1 block">
                  Вкажіть «URL сайту» в блоці «Інтеграції» — webhook збереться
                  сам
                  {data?.fromEnv.site_url
                    ? " (зараз підхоплюється з .env на сервері)."
                    : "."}
                </span>
              );
            })()}
          </div>
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
                {field.key === "site_url"
                  ? " Також використовується для Monobank webhook і сторінки після оплати."
                  : ""}
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
          disabled={saving}
        >
          Скинути
        </button>
        <button
          type="submit"
          className="admin-btn-primary"
          disabled={saving}
        >
          {saving ? "Збереження…" : "Зберегти"}
        </button>
      </div>
    </form>
  );
}
