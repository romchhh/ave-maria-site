-- Ave Maria: Волосся / Обличчя / Тіло (+ collections)

UPDATE categories
SET is_visible = FALSE, updated_at = NOW()
WHERE id IN (
  'dresses', 'bottoms', 'outerwear', 'tops', 'accessories',
  'perfumes', 'home', 'sale'
);

INSERT INTO categories (
  id, image, label_uk, label_en, cta_uk, cta_en, kind, sort_order, is_system, is_visible
) VALUES
  (
    'all',
    '/assets/categories/pop-all-v4.webp',
    'Усі товари',
    'All',
    'До категорії',
    'Shop now',
    'collection',
    0,
    TRUE,
    TRUE
  ),
  (
    'new',
    '/assets/categories/pop-new-v4.webp',
    'Новинки',
    'New in',
    'До категорії',
    'Shop now',
    'collection',
    1,
    TRUE,
    TRUE
  ),
  (
    'hair',
    '/assets/categories/pop-hair-v4.webp',
    'Волосся',
    'Hair',
    'До категорії',
    'Shop now',
    'category',
    2,
    FALSE,
    TRUE
  ),
  (
    'face',
    '/assets/categories/pop-face-v4.webp',
    'Обличчя',
    'Face',
    'До категорії',
    'Shop now',
    'category',
    3,
    FALSE,
    TRUE
  ),
  (
    'body',
    '/assets/categories/pop-body-v4.webp',
    'Тіло',
    'Body',
    'До категорії',
    'Shop now',
    'category',
    4,
    FALSE,
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  image = EXCLUDED.image,
  label_uk = EXCLUDED.label_uk,
  label_en = EXCLUDED.label_en,
  cta_uk = EXCLUDED.cta_uk,
  cta_en = EXCLUDED.cta_en,
  kind = EXCLUDED.kind,
  sort_order = EXCLUDED.sort_order,
  is_visible = EXCLUDED.is_visible,
  updated_at = NOW();
