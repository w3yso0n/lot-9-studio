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
  description TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
  sort_order INTEGER NOT NULL DEFAULT 0
);

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

-- Listados tienda: filtro publicados + orden por id
CREATE INDEX IF NOT EXISTS idx_products_published_id ON products (is_published, id DESC);

COMMIT;
