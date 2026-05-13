/**
 * Importa el catálogo desde scripts/legacy-data.ts (UTF-8; puedes copiarlo desde src/lib/data.ts).
 * Uso: definir DATABASE_URL en `.env` en la raíz del proyecto y ejecutar: pnpm run db:seed:legacy
 * ADVIERTE: vacía las tablas de productos (TRUNCATE products CASCADE) antes de insertar.
 */
import "dotenv/config";
import pg from "pg";
import { newDrops, products } from "./legacy-data";

type LegacyProduct = {
  id: number;
  name: string;
  price: number;
  color: string;
  images: string[];
  stockBySize: Record<string, number>;
  sizes: string[];
  colors: string[];
  desc?: string;
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL no está definida. Añádela en el archivo `.env` en la raíz del proyecto (el seed carga ese archivo con dotenv). Ejemplo en `.env.example`."
    );
  }
  const pool = new pg.Pool({ connectionString: url });
  const client = await pool.connect();
  const newDropOrder = new Map<number, number>(
    (newDrops as LegacyProduct[]).map((p, i) => [p.id, i])
  );

  try {
    await client.query("BEGIN");
    await client.query("TRUNCATE products CASCADE");

    for (const p of products as LegacyProduct[]) {
      await client.query(
        `INSERT INTO products (id, name, price, variant_label, description, is_published)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [p.id, p.name, p.price, p.color, p.desc ?? ""]
      );

      for (let i = 0; i < p.images.length; i++) {
        await client.query(
          `INSERT INTO product_images (product_id, path, sort_order) VALUES ($1, $2, $3)`,
          [p.id, p.images[i].trim(), i]
        );
      }

      for (const [size, qty] of Object.entries(p.stockBySize)) {
        await client.query(
          `INSERT INTO product_stock (product_id, size, quantity) VALUES ($1, $2, $3)`,
          [p.id, size, Math.max(0, Math.floor(Number(qty)))]
        );
      }

      for (const c of p.colors) {
        await client.query(
          `INSERT INTO product_color_filters (product_id, filter_value) VALUES ($1, $2)`,
          [p.id, c]
        );
      }

      for (let i = 0; i < p.sizes.length; i++) {
        await client.query(
          `INSERT INTO product_sizes (product_id, size, sort_order) VALUES ($1, $2, $3)`,
          [p.id, p.sizes[i], i]
        );
      }

      const nd = newDropOrder.get(p.id);
      if (nd !== undefined) {
        await client.query(
          `INSERT INTO new_drop_items (product_id, sort_order) VALUES ($1, $2)`,
          [p.id, nd]
        );
      }
    }

    await client.query(
      `SELECT setval(
        pg_get_serial_sequence('products', 'id'),
        COALESCE((SELECT MAX(id) FROM products), 1)
      )`
    );
    await client.query("COMMIT");
    console.log(`Listo: ${products.length} productos importados.`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
