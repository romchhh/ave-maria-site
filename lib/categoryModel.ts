/** Shared category types & pure helpers — safe for Client Components. */

export type CategoryKind = "collection" | "category";

/** Dynamic slug from DB (includes system collections `all` / `new`). */
export type CategoryId = string;

/** Storefront is UK-only; EN kept for admin / feeds. */
export type CategoryCopy = { uk: string; en: string };

export interface Category {
  id: CategoryId;
  image: string;
  /** Milliseconds — for ?v= when image path is unchanged */
  imageVersion: number;
  label: CategoryCopy;
  cta: CategoryCopy;
  kind: CategoryKind;
  sortOrder: number;
  isVisible: boolean;
  isSystem: boolean;
  /** Parent category id — null for top-level. */
  parentId: string | null;
  productCount?: number;
}

export type CategoryInput = {
  /** Optional — auto-generated from EN (or UK) label when omitted. */
  id?: string;
  image?: string;
  label: CategoryCopy;
  cta?: CategoryCopy;
  kind?: CategoryKind;
  sortOrder?: number;
  isVisible?: boolean;
  /** Optional parent — makes this a subcategory. */
  parentId?: string | null;
};

export function isAssignableCategory(c: Category): boolean {
  return c.kind === "category";
}

/** Top-level product categories (no parent) — carousel / primary filter. */
export function isTopLevelCategory(c: Category): boolean {
  return c.kind === "category" && !c.parentId;
}

export function getChildCategories(
  categories: Category[],
  parentId: string
): Category[] {
  return categories.filter(
    (c) => c.kind === "category" && c.parentId === parentId
  );
}

/**
 * Expand selected filter ids: selecting a parent includes its children.
 * Selecting only a child does not pull in siblings/parent.
 */
export function expandCategorySelection(
  selected: string[],
  categories: Category[]
): string[] {
  if (!selected.length) return selected;
  const childrenByParent = new Map<string, string[]>();
  for (const c of categories) {
    if (!c.parentId) continue;
    const list = childrenByParent.get(c.parentId) ?? [];
    list.push(c.id);
    childrenByParent.set(c.parentId, list);
  }
  const out = new Set(selected);
  for (const id of selected) {
    for (const child of childrenByParent.get(id) ?? []) out.add(child);
  }
  return [...out];
}
