-- Catalog visibility flag (hide from storefront listings; PDP still reachable by URL)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_products_is_visible
  ON products (is_visible)
  WHERE is_visible = TRUE;
