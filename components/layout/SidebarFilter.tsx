"use client";

import type { CSSProperties } from "react";
import type { Category } from "@/lib/categories";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type SortOrder = "newest" | "asc" | "desc";

interface SidebarFilterProps {
  isOpen: boolean;
  onClose: () => void;
  openAccordion: number | null;
  setOpenAccordion: (index: number | null) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  selectedSizes: string[];
  setSelectedSizes: (sizes: string[] | ((prev: string[]) => string[])) => void;
  selectedColors: string[];
  setSelectedColors: (colors: string[] | ((prev: string[]) => string[])) => void;
  selectedBrands: string[];
  setSelectedBrands: (
    brands: string[] | ((prev: string[]) => string[])
  ) => void;
  minPrice: number | null;
  maxPrice: number | null;
  setMinPrice: (v: number | null) => void;
  setMaxPrice: (v: number | null) => void;
  sizes: string[];
  colors: string[];
  brands: string[];
  priceHint: { min: number; max: number };
  selectedCategories: string[];
  setSelectedCategories: (
    categories: string[] | ((prev: string[]) => string[])
  ) => void;
  categories: Category[];
  onReset: () => void;
  resultCount: number;
}

function formatUah(n: number) {
  return `${Math.round(n).toLocaleString("uk-UA")} ₴`;
}

export default function SidebarFilter({
  isOpen,
  onClose,
  openAccordion,
  setOpenAccordion,
  sortOrder,
  setSortOrder,
  selectedSizes,
  setSelectedSizes,
  selectedColors,
  setSelectedColors,
  selectedBrands,
  setSelectedBrands,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  sizes,
  colors,
  brands,
  priceHint,
  selectedCategories,
  setSelectedCategories,
  categories,
  onReset,
  resultCount,
}: SidebarFilterProps) {
  const { t } = useI18n();

  const rangeMin = priceHint.min;
  const rangeMax = Math.max(priceHint.max, priceHint.min);
  const span = Math.max(rangeMax - rangeMin, 1);
  const lo = minPrice ?? rangeMin;
  const hi = maxPrice ?? rangeMax;
  const loPct = ((lo - rangeMin) / span) * 100;
  const hiPct = ((hi - rangeMin) / span) * 100;

  function toggleAccordion(index: number) {
    setOpenAccordion(openAccordion === index ? null : index);
  }

  function toggleSize(size: string) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  function toggleColor(color: string) {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  }

  function toggleBrand(brand: string) {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  }

  function toggleCategory(catId: string) {
    if (catId === "all") {
      setSelectedCategories([]);
      return;
    }
    setSelectedCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId]
    );
  }

  function onLoChange(raw: number) {
    const next = Math.min(Math.max(raw, rangeMin), hi);
    setMinPrice(next <= rangeMin ? null : next);
  }

  function onHiChange(raw: number) {
    const next = Math.max(Math.min(raw, rangeMax), lo);
    setMaxPrice(next >= rangeMax ? null : next);
  }

  return (
    <>
      <div
        className={`panel-backdrop${isOpen ? " open" : ""}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <aside
        className={`side-panel side-panel--filter${isOpen ? " open" : ""}`}
        aria-label={t.catalog.filters}
        aria-hidden={!isOpen}
      >
        <div className="side-panel-head">
          <h2>{t.catalog.filters}</h2>
          <button type="button" onClick={onClose} aria-label={t.a11y.close}>
            ×
          </button>
        </div>

        <div className="side-panel-body filter-body">
          <div className="filter-acc">
            <button
              type="button"
              className="filter-acc-head"
              aria-expanded={openAccordion === 0}
              onClick={() => toggleAccordion(0)}
            >
              <span>{t.catalog.category}</span>
              <span aria-hidden="true">{openAccordion === 0 ? "−" : "+"}</span>
            </button>
            {openAccordion === 0 && (
              <div className="filter-acc-body filter-checks">
                {categories.map((cat) =>
                  cat.id === "all" ? (
                    <label key={cat.id} className="filter-check">
                      <input
                        type="checkbox"
                        checked={selectedCategories.length === 0}
                        onChange={() => toggleCategory("all")}
                      />
                      <span>{cat.label.uk}</span>
                    </label>
                  ) : (
                    <label key={cat.id} className="filter-check">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                      />
                      <span>{cat.label.uk}</span>
                    </label>
                  )
                )}
              </div>
            )}
          </div>

          {brands.length > 0 && (
            <div className="filter-acc">
              <button
                type="button"
                className="filter-acc-head"
                aria-expanded={openAccordion === 1}
                onClick={() => toggleAccordion(1)}
              >
                <span>{t.catalog.brand}</span>
                <span aria-hidden="true">{openAccordion === 1 ? "−" : "+"}</span>
              </button>
              {openAccordion === 1 && (
                <div className="filter-acc-body filter-checks">
                  {brands.map((brand) => (
                    <label key={brand} className="filter-check">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="filter-acc">
            <button
              type="button"
              className="filter-acc-head"
              aria-expanded={openAccordion === 2}
              onClick={() => toggleAccordion(2)}
            >
              <span>{t.catalog.sort}</span>
              <span aria-hidden="true">{openAccordion === 2 ? "−" : "+"}</span>
            </button>
            {openAccordion === 2 && (
              <div className="filter-acc-body">
                {(
                  [
                    ["newest", t.catalog.sortNewest],
                    ["asc", t.catalog.sortAsc],
                    ["desc", t.catalog.sortDesc],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`filter-option${sortOrder === value ? " is-active" : ""}`}
                    onClick={() => setSortOrder(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {sizes.length > 0 && (
            <div className="filter-acc">
              <button
                type="button"
                className="filter-acc-head"
                aria-expanded={openAccordion === 3}
                onClick={() => toggleAccordion(3)}
              >
                <span>{t.catalog.size}</span>
                <span aria-hidden="true">{openAccordion === 3 ? "−" : "+"}</span>
              </button>
              {openAccordion === 3 && (
                <div className="filter-acc-body filter-checks">
                  {sizes.map((size) => (
                    <label key={size} className="filter-check">
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(size)}
                        onChange={() => toggleSize(size)}
                      />
                      <span>{size}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {colors.length > 0 && (
            <div className="filter-acc">
              <button
                type="button"
                className="filter-acc-head"
                aria-expanded={openAccordion === 4}
                onClick={() => toggleAccordion(4)}
              >
                <span>{t.catalog.color}</span>
                <span aria-hidden="true">{openAccordion === 4 ? "−" : "+"}</span>
              </button>
              {openAccordion === 4 && (
                <div className="filter-acc-body filter-checks">
                  {colors.map((color) => (
                    <label key={color} className="filter-check">
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(color)}
                        onChange={() => toggleColor(color)}
                      />
                      <span>{color}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="filter-acc">
            <button
              type="button"
              className="filter-acc-head"
              aria-expanded={openAccordion === 5}
              onClick={() => toggleAccordion(5)}
            >
              <span>{t.catalog.price}</span>
              <span aria-hidden="true">{openAccordion === 5 ? "−" : "+"}</span>
            </button>
            {openAccordion === 5 && (
              <div className="filter-acc-body filter-price-range">
                <div className="filter-price-values">
                  <span>
                    {t.catalog.minPrice} {formatUah(lo)}
                  </span>
                  <span>
                    {t.catalog.maxPrice} {formatUah(hi)}
                  </span>
                </div>
                <div
                  className="filter-range"
                  style={
                    {
                      "--range-lo": `${loPct}%`,
                      "--range-hi": `${hiPct}%`,
                    } as CSSProperties
                  }
                >
                  <input
                    type="range"
                    className="filter-range-input filter-range-input--lo"
                    min={rangeMin}
                    max={rangeMax}
                    step={1}
                    value={lo}
                    aria-label={t.catalog.minPrice}
                    onChange={(e) => onLoChange(Number(e.target.value))}
                  />
                  <input
                    type="range"
                    className="filter-range-input filter-range-input--hi"
                    min={rangeMin}
                    max={rangeMax}
                    step={1}
                    value={hi}
                    aria-label={t.catalog.maxPrice}
                    onChange={(e) => onHiChange(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="side-panel-foot filter-foot">
          <button type="button" className="filter-reset" onClick={onReset}>
            {t.catalog.reset}
          </button>
          <button type="button" className="btn-brand" onClick={onClose}>
            {t.catalog.count(resultCount)}
          </button>
        </div>
      </aside>
    </>
  );
}
