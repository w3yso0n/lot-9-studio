BEGIN;

CREATE TABLE IF NOT EXISTS product_badges (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  background_color TEXT NOT NULL DEFAULT '#000000',
  text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS badge_id INTEGER NULL REFERENCES product_badges (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_badge_id ON products (badge_id);

COMMIT;
