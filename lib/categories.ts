import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import {
  type Category,
  type CategoryCopy,
  type CategoryInput,
  type CategoryKind,
} from "@/lib/categoryModel";
import { isMissingRelationError, query } from "@/lib/db";
import { stripMediaQuery } from "@/lib/mediaUrl";
import { slugFromLabels, slugifyId } from "@/lib/slug";

export type {
  Category,
  CategoryCopy,
  CategoryId,
  CategoryInput,
  CategoryKind,
} from "@/lib/categoryModel";
export {
  expandCategorySelection,
  getChildCategories,
  isAssignableCategory,
  isTopLevelCategory,
} from "@/lib/categoryModel";

type CategoryRow = {
  id: string;
  image: string;
  updated_at?: Date | string;
  label_uk: string;
  label_en: string;
  cta_uk: string;
  cta_en: string;
  kind: CategoryKind;
  sort_order: number;
  is_visible: boolean;
  is_system: boolean;
  parent_id?: string | null;
  product_count?: string | number | null;
};

function mapCategory(row: CategoryRow): Category {
  const count =
    row.product_count == null ? undefined : Number(row.product_count);
  const imageVersion = row.updated_at
    ? new Date(row.updated_at).getTime()
    : 0;
  return {
    id: row.id,
    image: stripMediaQuery(row.image || ""),
    imageVersion,
    label: { uk: row.label_uk, en: row.label_en },
    cta: { uk: row.cta_uk, en: row.cta_en },
    kind: row.kind,
    sortOrder: row.sort_order,
    isVisible: Boolean(row.is_visible),
    isSystem: Boolean(row.is_system),
    parentId: row.parent_id ?? null,
    ...(typeof count === "number" && Number.isFinite(count)
      ? { productCount: count }
      : {}),
  };
}

const SELECT_BASE = `
  SELECT
    c.id,
    c.image,
    c.updated_at,
    c.label_uk,
    c.label_en,
    c.cta_uk,
    c.cta_en,
    c.kind,
    c.sort_order,
    c.is_visible,
    c.is_system,
    c.parent_id
`;

/** Auto-heal DBs that deployed before parent_id migration + seed hair concerns. */
let ensureParentPromise: Promise<void> | null = null;

async function ensureCategoryParentColumn(): Promise<void> {
  if (!ensureParentPromise) {
    ensureParentPromise = (async () => {
      try {
        await query(`
          ALTER TABLE categories
            ADD COLUMN IF NOT EXISTS parent_id TEXT
              REFERENCES categories(id) ON DELETE CASCADE
        `);
        await query(`
          CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id)
        `);
        // Seed «Підбір під ваш запит» under Волосся when parent exists.
        await query(`
          INSERT INTO categories (
            id, image, label_uk, label_en, cta_uk, cta_en,
            kind, sort_order, is_visible, is_system, parent_id
          )
          SELECT v.id, '', v.label_uk, v.label_en, 'До підбірки', 'Shop now',
                 'category', v.sort_order, TRUE, FALSE, 'hair'
          FROM (VALUES
            ('hair-dry', 'Сухе волосся', 'Dry hair', 100),
            ('hair-scalp', 'Очищення шкіри голови', 'Scalp cleansing', 101),
            ('hair-colored', 'Фарбоване', 'Colored hair', 102),
            ('hair-repair', 'На відновлення', 'Hair repair', 103)
          ) AS v(id, label_uk, label_en, sort_order)
          WHERE EXISTS (SELECT 1 FROM categories WHERE id = 'hair')
          ON CONFLICT (id) DO UPDATE SET
            label_uk = EXCLUDED.label_uk,
            label_en = EXCLUDED.label_en,
            parent_id = EXCLUDED.parent_id,
            kind = 'category',
            is_visible = TRUE,
            updated_at = NOW()
        `);
      } catch (error) {
        if (!isMissingRelationError(error)) {
          console.warn("[ensureCategoryParentColumn]", error);
        }
      }
    })();
  }
  await ensureParentPromise;
}

async function fetchCategoriesFromDb(opts?: {
  includeHidden?: boolean;
  withCounts?: boolean;
}): Promise<Category[]> {
  await ensureCategoryParentColumn();
  const includeHidden = opts?.includeHidden ?? false;
  const withCounts = opts?.withCounts ?? false;

  const where = includeHidden ? "" : "WHERE c.is_visible = TRUE";
  // Count products on this leaf OR (for parents) any direct child leaf.
  const countJoin = withCounts
    ? `LEFT JOIN products p ON (
         p.category = c.id
         OR p.category IN (SELECT ch.id FROM categories ch WHERE ch.parent_id = c.id)
       )`
    : "";
  const countSelect = withCounts
    ? `, COUNT(DISTINCT p.slug)::int AS product_count`
    : "";
  const groupBy = withCounts
    ? `GROUP BY c.id, c.image, c.updated_at, c.label_uk, c.label_en, c.cta_uk, c.cta_en,
         c.kind, c.sort_order, c.is_visible, c.is_system, c.parent_id`
    : "";

  try {
    const rows = await query<CategoryRow>(
      `${SELECT_BASE}${countSelect}
       FROM categories c
       ${countJoin}
       ${where}
       ${groupBy}
       ORDER BY c.sort_order ASC, c.id ASC`
    );
    return rows.map(mapCategory);
  } catch (error) {
    if (isMissingRelationError(error)) {
      console.warn(
        "[getCategories] table missing — run `npm run db:setup` before production."
      );
      return [];
    }
    throw error;
  }
}

function bustCategoryCache() {
  try {
    revalidateTag("categories");
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/catalog");
  } catch {
    /* scripts / outside request */
  }
}

/** Public storefront list (visible only), cached. */
export const getCategories = unstable_cache(
  async (): Promise<Category[]> => fetchCategoriesFromDb({ includeHidden: false }),
  ["ave-maria-categories-v3"],
  { revalidate: 300, tags: ["categories"] }
);

/** Admin list with hidden + product counts. */
export async function getAdminCategories(): Promise<Category[]> {
  return fetchCategoriesFromDb({ includeHidden: true, withCounts: true });
}

export async function getCategoryById(id: string): Promise<Category | null> {
  await ensureCategoryParentColumn();
  const rows = await query<CategoryRow>(
    `${SELECT_BASE}
     FROM categories c
     WHERE c.id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] ? mapCategory(rows[0]) : null;
}

export async function isCategoryId(
  value: string | null | undefined
): Promise<boolean> {
  if (!value) return false;
  const cats = await getCategories();
  return cats.some((c) => c.id === value);
}

async function uniqueCategoryId(base: string): Promise<string> {
  let id = base;
  let n = 2;
  while (true) {
    if (id === "all" || id === "new") {
      id = `${base}-${n}`;
      n += 1;
      continue;
    }
    const existing = await getCategoryById(id);
    if (!existing) return id;
    id = `${base}-${n}`;
    n += 1;
  }
}

async function assertValidParent(
  parentId: string | null | undefined,
  selfId?: string
): Promise<string | null> {
  if (!parentId) return null;
  if (selfId && parentId === selfId) {
    throw new Error("Category cannot be its own parent");
  }
  const parent = await getCategoryById(parentId);
  if (!parent) throw new Error("Parent category not found");
  if (parent.kind !== "category") {
    throw new Error("Subcategories only under product categories");
  }
  if (parent.parentId) {
    throw new Error("Only one level of subcategories is supported");
  }
  return parent.id;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  await ensureCategoryParentColumn();
  const raw =
    (input.id && input.id.trim()) ||
    slugFromLabels(input.label);
  const base = slugifyId(raw);
  if (!base) throw new Error("Invalid category id");

  const id = await uniqueCategoryId(base);
  const parentId = await assertValidParent(input.parentId);

  let sortOrder = input.sortOrder;
  if (sortOrder == null) {
    const rows = await query<{ max: number | null }>(
      parentId
        ? `SELECT MAX(sort_order) AS max FROM categories WHERE parent_id = $1`
        : `SELECT MAX(sort_order) AS max FROM categories WHERE parent_id IS NULL`,
      parentId ? [parentId] : []
    );
    sortOrder = (rows[0]?.max ?? 0) + 1;
  }

  await query(
    `INSERT INTO categories (
      id, image, label_uk, label_en, cta_uk, cta_en, kind, sort_order, is_visible, is_system, parent_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,FALSE,$10)`,
    [
      id,
      stripMediaQuery(input.image ?? ""),
      input.label.uk.trim(),
      input.label.en.trim(),
      input.cta?.uk?.trim() || (parentId ? "До підбірки" : "До категорії"),
      input.cta?.en?.trim() || "Shop now",
      input.kind === "collection" ? "collection" : "category",
      sortOrder,
      input.isVisible !== false,
      parentId,
    ]
  );

  bustCategoryCache();
  const created = await getCategoryById(id);
  if (!created) throw new Error("Failed to create category");
  return created;
}

export async function updateCategory(
  id: string,
  patch: Partial<CategoryInput> & { sortOrder?: number; isVisible?: boolean }
): Promise<Category> {
  await ensureCategoryParentColumn();
  const current = await getCategoryById(id);
  if (!current) throw new Error("Category not found");

  const image = stripMediaQuery(
    patch.image != null ? patch.image : current.image
  );
  const labelUk = patch.label?.uk?.trim() ?? current.label.uk;
  const labelEn = patch.label?.en?.trim() ?? current.label.en;
  const ctaUk = patch.cta?.uk?.trim() ?? current.cta.uk;
  const ctaEn = patch.cta?.en?.trim() ?? current.cta.en;
  const sortOrder = patch.sortOrder ?? current.sortOrder;
  const isVisible =
    patch.isVisible !== undefined ? patch.isVisible : current.isVisible;

  const kind = current.isSystem
    ? current.kind
    : patch.kind === "collection"
      ? "collection"
      : current.kind;

  const parentId =
    patch.parentId !== undefined
      ? await assertValidParent(patch.parentId, id)
      : current.parentId;

  if (parentId && kind === "collection") {
    throw new Error("Collections cannot be subcategories");
  }

  // Don't nest under a node that already has this as ancestor (one level only already enforced).
  const childCount = (
    await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM categories WHERE parent_id = $1`,
      [id]
    )
  )[0];
  if (parentId && Number(childCount?.count || 0) > 0) {
    throw new Error("Move children first — parent categories cannot nest");
  }

  await query(
    `UPDATE categories SET
      image = $2,
      label_uk = $3,
      label_en = $4,
      cta_uk = $5,
      cta_en = $6,
      kind = $7,
      sort_order = $8,
      is_visible = $9,
      parent_id = $10,
      updated_at = NOW()
     WHERE id = $1`,
    [
      id,
      image,
      labelUk,
      labelEn,
      ctaUk,
      ctaEn,
      kind,
      sortOrder,
      isVisible,
      parentId,
    ]
  );

  bustCategoryCache();
  const updated = await getCategoryById(id);
  if (!updated) throw new Error("Failed to update category");
  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  await ensureCategoryParentColumn();
  const current = await getCategoryById(id);
  if (!current) throw new Error("Category not found");
  if (current.isSystem) {
    throw new Error("System categories cannot be deleted");
  }

  const childRows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM categories WHERE parent_id = $1`,
    [id]
  );
  if (Number(childRows[0]?.count || 0) > 0) {
    throw new Error("Category has subcategories — delete or move them first");
  }

  const rows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM products WHERE category = $1`,
    [id]
  );
  if (Number(rows[0]?.count || 0) > 0) {
    throw new Error("Category has products — reassign them first");
  }

  await query(`DELETE FROM categories WHERE id = $1`, [id]);
  bustCategoryCache();
}

export async function reorderCategories(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await query(
    `UPDATE categories AS c SET
      sort_order = v.ord,
      updated_at = NOW()
     FROM (
       SELECT * FROM unnest($1::text[]) WITH ORDINALITY AS t(id, ord)
     ) AS v
     WHERE c.id = v.id`,
    [ids]
  );
  bustCategoryCache();
}
