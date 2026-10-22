"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/admin/ComponentCard";
import ProductMediaManager from "@/components/admin/ProductMediaManager";
import ProductRelationPicker from "@/components/admin/ProductRelationPicker";
import Label from "@/components/admin/form/Label";
import Input from "@/components/admin/form/input/InputField";
import TextArea from "@/components/admin/form/input/TextArea";
import Select from "@/components/admin/form/Select";
import ToggleSwitch from "@/components/admin/form/ToggleSwitch";
import { adminProductsListHref } from "@/lib/adminProductsListState";
import type { Category } from "@/lib/categories";
import type { Product, ProductMedia } from "@/lib/types";

const PRESET_VOLUMES = [
  "10 мл",
  "15 мл",
  "30 мл",
  "50 мл",
  "100 мл",
  "150 мл",
  "200 мл",
];

type Props = { productId?: string };

type FormState = {
  nameUk: string;
  id: string;
  priceUah: string;
  compareAtUah: string;
  category: string;
  material: string;
  characteristics: string;
  notes: string;
  activeIngredients: string;
  usage: string;
  sizeOptions: string[];
  descriptionUk: string;
  longUk: string;
  inStock: boolean;
  isVisible: boolean;
  isNew: boolean;
  isPopular: boolean;
  isSale: boolean;
  media: ProductMedia[];
};

const EMPTY: FormState = {
  nameUk: "",
  id: "",
  priceUah: "",
  compareAtUah: "",
  category: "",
  material: "",
  characteristics: "",
  notes: "",
  activeIngredients: "",
  usage: "",
  sizeOptions: ["30 мл"],
  descriptionUk: "",
  longUk: "",
  inStock: true,
  isVisible: true,
  isNew: false,
  isPopular: false,
  isSale: false,
  media: [],
};

export default function ProductForm({ productId }: Props) {
  const router = useRouter();
  const isEdit = Boolean(productId);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [customVolume, setCustomVolume] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseCategoryOptions, setBaseCategoryOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [relatedIds, setRelatedIds] = useState<string[]>([]);
  const [listBackHref, setListBackHref] = useState("/admin/products");

  useEffect(() => {
    setListBackHref(adminProductsListHref());
  }, []);

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catsRes, productsRes] = await Promise.all([
          fetch("/api/admin/categories", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/admin/products", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);
        if (catsRes.ok) {
          const data = (await catsRes.json()) as Category[];
          if (!cancelled && Array.isArray(data)) {
            setBaseCategoryOptions(
              data
                .filter((c) => c.kind === "category")
                .map((c) => ({ value: c.id, label: c.label.uk }))
            );
          }
        }
        if (productsRes.ok) {
          const data = (await productsRes.json()) as Product[];
          if (!cancelled && Array.isArray(data)) setCatalog(data);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/products/${encodeURIComponent(productId)}`,
          { credentials: "include", cache: "no-store" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const p = (await res.json()) as Product;
        if (cancelled) return;
        const media: ProductMedia[] =
          p.media?.length
            ? p.media
            : (p.images || []).map((url) => ({ url, type: "image" as const }));
        setForm({
          nameUk: p.name ?? "",
          id: p.id,
          priceUah: String(p.priceNum ?? ""),
          compareAtUah:
            p.compareAtPriceNum != null ? String(p.compareAtPriceNum) : "",
          category: p.category ?? "",
          material: p.material ?? "",
          characteristics: p.characteristics || "",
          notes: p.notes || "",
          activeIngredients:
            p.activeIngredients || p.characteristics || p.modelParams || "",
          usage: p.usage || "",
          sizeOptions: Array.isArray(p.sizeOptions) ? p.sizeOptions : [],
          descriptionUk: p.description ?? "",
          longUk: p.longDescription || p.description || "",
          inStock: p.inStock !== false,
          isVisible: p.isVisible !== false,
          isNew: Boolean(p.isNew),
          isPopular: Boolean(p.isPopular),
          isSale: Boolean(p.isSale),
          media,
        });
        setRelatedIds(
          Array.isArray(p.lookProductIds) ? p.lookProductIds : []
        );
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Не вдалося завантажити товар");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const categoryOptions = React.useMemo(() => {
    if (
      form.category &&
      !baseCategoryOptions.some((o) => o.value === form.category)
    ) {
      return [
        ...baseCategoryOptions,
        { value: form.category, label: form.category },
      ];
    }
    return baseCategoryOptions;
  }, [form.category, baseCategoryOptions]);

  const toggleVolume = (vol: string) =>
    setForm((prev) => ({
      ...prev,
      sizeOptions: prev.sizeOptions.includes(vol)
        ? prev.sizeOptions.filter((s) => s !== vol)
        : [...prev.sizeOptions, vol],
    }));

  const addCustomVolumes = () => {
    const parts = customVolume
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    setForm((prev) => ({
      ...prev,
      sizeOptions: Array.from(new Set([...prev.sizeOptions, ...parts])),
    }));
    setCustomVolume("");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.nameUk.trim()) {
      setError("Вкажіть назву товару");
      return;
    }
    const priceNum = Number(form.priceUah);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError("Вкажіть коректну ціну в грн");
      return;
    }
    if (!form.sizeOptions.length) {
      setError("Додайте хоча б один обʼєм");
      return;
    }
    const compareAt = form.compareAtUah.trim()
      ? Number(form.compareAtUah)
      : null;

    const images = form.media
      .filter((m) => m.type === "image")
      .map((m) => m.url);
    const volumeLabel = form.sizeOptions[0] || "";
    const payload: Record<string, unknown> = {
      name: form.nameUk.trim(),
      nameEn: form.nameUk.trim(),
      priceNum,
      priceEur: null,
      compareAtPriceNum:
        compareAt != null && Number.isFinite(compareAt) && compareAt > 0
          ? compareAt
          : null,
      category: form.category || undefined,
      color: volumeLabel,
      colorHex: "",
      material: form.material.trim(),
      characteristics: form.characteristics.trim(),
      notes: form.notes.trim(),
      activeIngredients: form.activeIngredients.trim(),
      usage: form.usage.trim(),
      photoSize: "",
      sizeOptions: form.sizeOptions,
      description: form.descriptionUk.trim() || form.longUk.trim(),
      descriptionEn: form.descriptionUk.trim() || form.longUk.trim(),
      longDescription: form.longUk.trim() || form.descriptionUk.trim(),
      longDescriptionEn: form.longUk.trim() || form.descriptionUk.trim(),
      inStock: form.inStock,
      isVisible: form.isVisible,
      isNew: form.isNew,
      isPopular: form.isPopular,
      isSale: form.isSale || (compareAt != null && compareAt > priceNum),
      images,
      media: form.media,
      lookProductIds: relatedIds,
      swatches: volumeLabel
        ? [
            {
              img: images[0] || "",
              label: volumeLabel,
              hex: "#C9B59A",
            },
          ]
        : [],
    };

    setSaving(true);
    try {
      const res = await fetch(
        isEdit
          ? `/api/admin/products/${encodeURIComponent(productId as string)}`
          : "/api/admin/products",
        {
          method: isEdit ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data?.error === "name_required"
            ? "Вкажіть назву товару"
            : `HTTP ${res.status}`
        );
      }
      try {
        const { clearCacheByPrefix, CACHE_KEYS } = await import("@/lib/cache");
        clearCacheByPrefix("cache_product");
        clearCacheByPrefix(CACHE_KEYS.PRODUCTS);
      } catch {
        /* ignore */
      }
      router.push(adminProductsListHref());
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error && !err.message.startsWith("HTTP")
          ? err.message
          : "Не вдалося зберегти товар"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate() {
    if (!productId) return;
    setDuplicating(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(productId)}/duplicate`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const copy = (await res.json()) as Product;
      router.push(`/admin/products/${encodeURIComponent(copy.id)}/edit`);
      router.refresh();
    } catch (e) {
      console.error(e);
      setError("Не вдалося скопіювати товар");
    } finally {
      setDuplicating(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-panel px-5 py-8 text-sm text-gray-500">
        Завантаження…
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-6"
      data-tour="tour-product-form"
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {isEdit && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleDuplicate()}
            disabled={duplicating || saving}
            className="admin-btn-secondary"
          >
            {duplicating ? "Копіювання…" : "Копіювати товар"}
          </button>
        </div>
      )}

      <ComponentCard
        title="Фото"
        desc="Перше фото — обкладинка в каталозі. Формат Instagram 4:5 (1080×1350)."
      >
        <ProductMediaManager
          media={form.media}
          onChange={(media) => set("media", media)}
        />
      </ComponentCard>

      <ComponentCard title="Назва" desc="Назва для вітрини, кошика та SEO.">
        <div>
          <Label htmlFor="nameUk">Назва товару *</Label>
          <Input
            id="nameUk"
            value={form.nameUk}
            onChange={(e) => set("nameUk", e.target.value)}
            placeholder="Крем для рук BAKERY"
          />
        </div>
        {isEdit && (
          <p className="mt-2 text-xs text-gray-400">
            Slug: <code>{form.id}</code>
          </p>
        )}
      </ComponentCard>

      <ComponentCard
        title="Ціна"
        desc="Актуальна ціна в гривнях. Стара ціна вмикає знижку на картці."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="priceUah">Ціна, ₴ *</Label>
            <Input
              id="priceUah"
              type="number"
              min="0"
              step={1}
              value={form.priceUah}
              onChange={(e) => set("priceUah", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="compareAt">Стара ціна, ₴ (знижка)</Label>
            <Input
              id="compareAt"
              type="number"
              min="0"
              step={1}
              value={form.compareAtUah}
              onChange={(e) => {
                set("compareAtUah", e.target.value);
                if (e.target.value.trim()) set("isSale", true);
              }}
              placeholder="Необовʼязково"
            />
          </div>
        </div>
      </ComponentCard>

      <ComponentCard
        title="Опис"
        desc="Короткий — для картки; повний — для сторінки товару."
      >
        <div className="space-y-4">
          <div>
            <Label>Короткий опис</Label>
            <TextArea
              rows={2}
              value={form.descriptionUk}
              onChange={(v) => set("descriptionUk", v)}
              placeholder="Один-два речення для картки та SEO"
            />
          </div>
          <div>
            <Label>Повний опис (на сторінці товару)</Label>
            <TextArea
              rows={5}
              value={form.longUk}
              onChange={(v) => set("longUk", v)}
              placeholder="Детальний опис продукту, аромат, ефект…"
            />
          </div>
        </div>
      </ComponentCard>

      <ComponentCard
        title="Обʼєм"
        desc="Варіанти обʼєму на сторінці товару. Можна додати свій."
      >
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set([...PRESET_VOLUMES, ...form.sizeOptions])).map(
            (vol) => {
              const active = form.sizeOptions.includes(vol);
              return (
                <button
                  key={vol}
                  type="button"
                  onClick={() => toggleVolume(vol)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900"
                      : "border-gray-300 text-gray-700 hover:border-gray-500 dark:border-gray-700 dark:text-gray-300"
                  }`}
                >
                  {vol}
                </button>
              );
            }
          )}
        </div>
        <div className="mt-3 flex max-w-md items-center gap-2">
          <Input
            value={customVolume}
            onChange={(e) => setCustomVolume(e.target.value)}
            placeholder="Свій обʼєм, напр. 75 мл"
          />
          <button
            type="button"
            onClick={addCustomVolumes}
            className="admin-btn-secondary shrink-0"
          >
            Додати
          </button>
        </div>
      </ComponentCard>

      <ComponentCard
        title="Деталі на сторінці товару (акордеони)"
        desc="Блоки, що розгортаються під описом: ноти, інгредієнти, застосування, склад."
      >
        <div className="space-y-4">
          <div>
            <Label>Ноти</Label>
            <TextArea
              rows={2}
              value={form.notes}
              onChange={(v) => set("notes", v)}
              placeholder="Верхні / серцеві / базові ноти…"
            />
          </div>
          <div>
            <Label>Активні інгредієнти</Label>
            <TextArea
              rows={3}
              value={form.activeIngredients}
              onChange={(v) => {
                set("activeIngredients", v);
                set("characteristics", v);
              }}
              placeholder="Гіалуронова кислота, пантенол…"
            />
          </div>
          <div>
            <Label>Спосіб застосування</Label>
            <TextArea
              rows={3}
              value={form.usage}
              onChange={(v) => set("usage", v)}
              placeholder="Нанесіть на чисту шкіру…"
            />
          </div>
          <div>
            <Label>Склад</Label>
            <TextArea
              rows={3}
              value={form.material}
              onChange={(v) => set("material", v)}
              placeholder="Aqua, Glycerin…"
            />
          </div>
        </div>
      </ComponentCard>

      <ComponentCard
        title="Категорія та мітки"
        desc="Наявність блокує замовлення. «У каталозі» ховає товар з вітрини (сторінка за прямим посиланням лишається)."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Категорія</Label>
            <Select
              options={categoryOptions}
              placeholder="Оберіть категорію"
              value={form.category}
              onChange={(v) => set("category", v)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-6">
            <ToggleSwitch
              label="В наявності"
              enabled={form.inStock}
              setEnabled={(v) => set("inStock", v)}
            />
            <ToggleSwitch
              label="У каталозі"
              enabled={form.isVisible}
              setEnabled={(v) => set("isVisible", v)}
            />
            <ToggleSwitch
              label="New"
              enabled={form.isNew}
              setEnabled={(v) => set("isNew", v)}
            />
            <ToggleSwitch
              label="Sale"
              enabled={form.isSale}
              setEnabled={(v) => set("isSale", v)}
            />
            <ToggleSwitch
              label="Популярні"
              enabled={form.isPopular}
              setEnabled={(v) => set("isPopular", v)}
            />
          </div>
        </div>
      </ComponentCard>

      <ComponentCard
        title="Схожі пропозиції"
        desc="Ручний підбір для блоку на PDP. Якщо порожньо — підтягнуться з тієї ж категорії."
      >
        <ProductRelationPicker
          label="Схожі товари"
          description="Показуються в блоці «Схожі пропозиції» на сторінці товару. Якщо порожньо — підберуться з тієї ж категорії."
          catalog={catalog}
          excludeId={productId}
          selectedIds={relatedIds}
          onChange={setRelatedIds}
          emptyHint="Додайте товари через пошук"
        />
      </ComponentCard>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link href={listBackHref} className="admin-btn-secondary">
          Скасувати
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="admin-btn-primary disabled:opacity-50"
        >
          {saving
            ? "Збереження…"
            : isEdit
              ? "Зберегти зміни"
              : "Створити товар"}
        </button>
      </div>
    </form>
  );
}
