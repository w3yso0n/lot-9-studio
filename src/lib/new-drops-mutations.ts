import { getPool } from "@/lib/db";

export type NewDropSelectionInput = {
  productId: number;
  selectedImagePath: string;
  sortOrder: number;
};

export async function replaceNewDropItems(
  items: NewDropSelectionInput[]
): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM new_drop_items`);

    const unique = new Map<number, NewDropSelectionInput>();
    for (const item of items) {
      if (!Number.isFinite(item.productId) || item.productId <= 0) continue;
      unique.set(item.productId, item);
    }

    const ordered = [...unique.values()].sort((a, b) => a.sortOrder - b.sortOrder);
    for (let index = 0; index < ordered.length; index++) {
      const item = ordered[index];
      await client.query(
        `INSERT INTO new_drop_items (product_id, selected_image_path, sort_order)
         VALUES ($1, NULLIF($2, ''), $3)
         ON CONFLICT (product_id)
         DO UPDATE SET
           selected_image_path = EXCLUDED.selected_image_path,
           sort_order = EXCLUDED.sort_order`,
        [item.productId, item.selectedImagePath.trim(), index]
      );
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
