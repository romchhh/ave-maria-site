-- Ave Maria Beauty Lab — replace clothing categories with beauty catalog

-- Drop old clothing categories that won't be used (products will be re-seeded)
DELETE FROM categories
WHERE id IN ('dresses', 'bottoms', 'outerwear', 'tops', 'accessories')
  AND is_system = FALSE;

INSERT INTO categories (
  id, image, label_uk, label_en, cta_uk, cta_en, kind, sort_order, is_system, is_visible
) VALUES
  (
    'all',
    '/assets/categories/bestsellers.webp',
    'Бестселери',
    'Bestsellers',
    'До категорії',
    'Shop now',
    'collection',
    0,
    TRUE,
    TRUE
  ),
  (
    'new',
    '/assets/categories/new.webp',
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
    'perfumes',
    '/assets/categories/perfumes.webp',
    'Парфуми',
    'Perfumes',
    'До категорії',
    'Shop now',
    'category',
    2,
    FALSE,
    TRUE
  ),
  (
    'home',
    '/assets/categories/home.webp',
    'Аромати для дому',
    'Home scents',
    'До категорії',
    'Shop now',
    'category',
    3,
    FALSE,
    TRUE
  ),
  (
    'body',
    '/assets/categories/body.webp',
    'Догляд за тілом',
    'Body care',
    'До категорії',
    'Shop now',
    'category',
    4,
    FALSE,
    TRUE
  ),
  (
    'sale',
    '/assets/categories/sale.webp',
    'Sale',
    'Sale',
    'До категорії',
    'Shop now',
    'collection',
    5,
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
