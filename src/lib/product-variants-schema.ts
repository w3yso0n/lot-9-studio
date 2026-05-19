import type { Pool, PoolClient } from "pg";

type Db = Pool | PoolClient;

export async function ensureProductVariantsSchema(db: Db): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS product_variant_links (
      product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
      variant_product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
      sort_order SMALLINT NOT NULL DEFAULT 0,
      PRIMARY KEY (product_id, variant_product_id),
      CHECK (product_id <> variant_product_id)
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_product_variant_links_variant
    ON product_variant_links (variant_product_id)
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS product_color_variants (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
      label VARCHAR(255) NOT NULL DEFAULT '',
      image_path TEXT NOT NULL,
      sort_order SMALLINT NOT NULL DEFAULT 0
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_product_color_variants_product
    ON product_color_variants (product_id, sort_order, id)
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS product_color_variant_images (
      id SERIAL PRIMARY KEY,
      color_variant_id INTEGER NOT NULL REFERENCES product_color_variants (id) ON DELETE CASCADE,
      image_path TEXT NOT NULL,
      sort_order SMALLINT NOT NULL DEFAULT 0
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_product_color_variant_images_variant
    ON product_color_variant_images (color_variant_id, sort_order, id)
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS product_color_variant_stock (
      color_variant_id INTEGER NOT NULL REFERENCES product_color_variants (id) ON DELETE CASCADE,
      size VARCHAR(16) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
      PRIMARY KEY (color_variant_id, size)
    )
  `);
}
