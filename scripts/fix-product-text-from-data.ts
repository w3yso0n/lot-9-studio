/**
 * Corrige nombre, variante y descripción en Postgres usando `src/lib/data.ts` (UTF-8).
 * Útil si el seed se hizo con `legacy-data.ts` mal codificado (mojibake: ñ → ├▒).
 *
 * Uso: pnpm run db:fix-text
 */
import "dotenv/config";
import pg from "pg";
import { products } from "../src/lib/data";

type Row = {
  id: number;
  name: string;
  color: string;
  desc?: string;
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no definida.");
  const pool = new pg.Pool({ connectionString: url });
  try {
    for (const p of products as Row[]) {
      const { rowCount } = await pool.query(
        `UPDATE products SET name = $1, variant_label = $2, description = $3 WHERE id = $4`,
        [p.name, p.color, p.desc ?? "", p.id]
      );
      if (rowCount) console.log(`OK id=${p.id} (${p.name})`);
    }
    console.log("Textos actualizados desde src/lib/data.ts.");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
