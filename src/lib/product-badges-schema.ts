import { getPool } from "@/lib/db";

const globalForProductBadges = globalThis as unknown as {
  productBadgesSchemaReady?: Promise<void>;
};

export function ensureProductBadgesSchema(): Promise<void> {
  if (!globalForProductBadges.productBadgesSchemaReady) {
    globalForProductBadges.productBadgesSchemaReady = (async () => {
      const pool = getPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS product_badges (
          id SERIAL PRIMARY KEY,
          label TEXT NOT NULL,
          background_color TEXT NOT NULL DEFAULT '#000000',
          text_color TEXT NOT NULL DEFAULT '#FFFFFF',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        ALTER TABLE products
          ADD COLUMN IF NOT EXISTS badge_id INTEGER NULL;

        DO $$
        BEGIN
          ALTER TABLE products
            ADD CONSTRAINT products_badge_id_fkey
            FOREIGN KEY (badge_id)
            REFERENCES product_badges (id)
            ON DELETE SET NULL;
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END $$;

        CREATE INDEX IF NOT EXISTS idx_products_badge_id ON products (badge_id);
      `);
    })().catch((error) => {
      globalForProductBadges.productBadgesSchemaReady = undefined;
      throw error;
    });
  }

  return globalForProductBadges.productBadgesSchemaReady;
}
