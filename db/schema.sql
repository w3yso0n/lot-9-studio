-- Esquema para Lot-9 Studio (PostgreSQL)
-- Ejecutar sobre la base de datos `lot-9`, por ejemplo:
--   psql "postgresql://user:pass@host:5432/lot-9" -f db/schema.sql

BEGIN;

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  old_price NUMERIC(10, 2) CHECK (old_price IS NULL OR old_price >= 0),
  variant_label VARCHAR(255) NOT NULL,
  cover_image_path TEXT,
  hover_image_path TEXT,
  description TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cover_image_path TEXT;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS hover_image_path TEXT;

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

CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images (product_id);

CREATE TABLE IF NOT EXISTS product_stock (
  product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  size VARCHAR(16) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  PRIMARY KEY (product_id, size)
);

-- Etiquetas tipo "Black", "White" (equivalente al array `colors` del JSON legado)
CREATE TABLE IF NOT EXISTS product_color_filters (
  product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  filter_value VARCHAR(64) NOT NULL,
  PRIMARY KEY (product_id, filter_value)
);

-- Tallas mostradas y orden (si está vacío, la app puede derivarlas del stock)
CREATE TABLE IF NOT EXISTS product_sizes (
  product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  size VARCHAR(16) NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, size)
);

CREATE TABLE IF NOT EXISTS new_drop_items (
  product_id INTEGER PRIMARY KEY REFERENCES products (id) ON DELETE CASCADE,
  selected_image_path TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE new_drop_items
  ADD COLUMN IF NOT EXISTS selected_image_path TEXT;

CREATE INDEX IF NOT EXISTS idx_new_drop_sort ON new_drop_items (sort_order);

CREATE TABLE IF NOT EXISTS product_variant_links (
  product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  variant_product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, variant_product_id),
  CHECK (product_id <> variant_product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_variant_links_variant
  ON product_variant_links (variant_product_id);

CREATE TABLE IF NOT EXISTS product_color_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL DEFAULT '',
  image_path TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_product_color_variants_product
  ON product_color_variants (product_id, sort_order, id);

CREATE TABLE IF NOT EXISTS product_color_variant_images (
  id SERIAL PRIMARY KEY,
  color_variant_id INTEGER NOT NULL REFERENCES product_color_variants (id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_product_color_variant_images_variant
  ON product_color_variant_images (color_variant_id, sort_order, id);

CREATE TABLE IF NOT EXISTS product_color_variant_stock (
  color_variant_id INTEGER NOT NULL REFERENCES product_color_variants (id) ON DELETE CASCADE,
  size VARCHAR(16) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  PRIMARY KEY (color_variant_id, size)
);

CREATE TABLE IF NOT EXISTS home_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hero_title TEXT NOT NULL DEFAULT '',
  hero_subtitle TEXT NOT NULL DEFAULT '',
  hero_button_text TEXT NOT NULL DEFAULT '',
  hero_button_href TEXT NOT NULL DEFAULT '/products',
  hero_image_url TEXT,
  featured_video_url TEXT,
  is_hero_enabled BOOLEAN NOT NULL DEFAULT true,
  is_video_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

UPDATE products p
SET cover_image_path = COALESCE(
  (
    SELECT pi.path
    FROM product_images pi
    WHERE pi.product_id = p.id
    ORDER BY pi.sort_order, pi.id
    LIMIT 1
  ),
  (
    SELECT COALESCE(pcvi.image_path, pcv.image_path)
    FROM product_color_variants pcv
    LEFT JOIN LATERAL (
      SELECT image_path
      FROM product_color_variant_images pcvi
      WHERE pcvi.color_variant_id = pcv.id
      ORDER BY pcvi.sort_order, pcvi.id
      LIMIT 1
    ) pcvi ON true
    WHERE pcv.product_id = p.id
    ORDER BY pcv.sort_order, pcv.id
    LIMIT 1
  )
)
WHERE p.cover_image_path IS NULL;

-- Listados tienda: filtro publicados + orden por id
CREATE INDEX IF NOT EXISTS idx_products_published_id ON products (is_published, id DESC);

COMMIT;
