-- Optional subcategories via parent_id.
-- Products still store a single `category` slug = leaf (subcategory if set, else top-level).

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_id TEXT
    REFERENCES categories(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- Hair concerns — «Підбір під ваш запит»
INSERT INTO categories (
  id, image, label_uk, label_en, cta_uk, cta_en, kind, sort_order, is_visible, is_system, parent_id
) VALUES
  (
    'hair-dry',
    '',
    'Сухе волосся',
    'Dry hair',
    'До підбірки',
    'Shop now',
    'category',
    100,
    TRUE,
    FALSE,
    'hair'
  ),
  (
    'hair-scalp',
    '',
    'Очищення шкіри голови',
    'Scalp cleansing',
    'До підбірки',
    'Shop now',
    'category',
    101,
    TRUE,
    FALSE,
    'hair'
  ),
  (
    'hair-colored',
    '',
    'Фарбоване',
    'Colored hair',
    'До підбірки',
    'Shop now',
    'category',
    102,
    TRUE,
    FALSE,
    'hair'
  ),
  (
    'hair-repair',
    '',
    'На відновлення',
    'Hair repair',
    'До підбірки',
    'Shop now',
    'category',
    103,
    TRUE,
    FALSE,
    'hair'
  )
ON CONFLICT (id) DO UPDATE SET
  label_uk = EXCLUDED.label_uk,
  label_en = EXCLUDED.label_en,
  parent_id = EXCLUDED.parent_id,
  kind = 'category',
  is_visible = TRUE,
  updated_at = NOW();
