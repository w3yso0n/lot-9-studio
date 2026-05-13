import { getPool } from "@/lib/db";
import { absolutePublicPathFromWeb, isOwnedUploadPath } from "@/lib/upload-products";
import { CATALOG_COLOR_FILTER_OPTIONS } from "@/lib/catalog-color-filters";
import { CATALOG_SIZE_ORDER } from "@/lib/catalog-sizes";
import { unlink } from "node:fs/promises";
import type { PoolClient } from "pg";

export type ProductMutationInput = {
  name: string;
  price: number;
  variantLabel: string;
  description: string;
  isPublished: boolean;
  imagePaths: string[];
  colorFilters: string[];
  sizeOrder: string[];
  stockBySize: Record<string, number>;
  isNewDrop: boolean;
  newDropSort: number;
};

async function replaceChildRows(
  client: PoolClient,
  productId: number,
  input: ProductMutationInput
): Promise<void> {
  await client.query(`DELETE FROM product_images WHERE product_id = $1`, [productId]);
  for (let i = 0; i < input.imagePaths.length; i++) {
    await client.query(
      `INSERT INTO product_images (product_id, path, sort_order) VALUES ($1, $2, $3)`,
      [productId, input.imagePaths[i], i]
    );
  }

  await client.query(`DELETE FROM product_stock WHERE product_id = $1`, [productId]);
  for (const [size, qty] of Object.entries(input.stockBySize)) {
    await client.query(
      `INSERT INTO product_stock (product_id, size, quantity) VALUES ($1, $2, $3)`,
      [productId, size, Math.max(0, Math.floor(qty))]
    );
  }

  await client.query(`DELETE FROM product_color_filters WHERE product_id = $1`, [productId]);
  for (const tag of input.colorFilters) {
    await client.query(
      `INSERT INTO product_color_filters (product_id, filter_value) VALUES ($1, $2)`,
      [productId, tag]
    );
  }

  await client.query(`DELETE FROM product_sizes WHERE product_id = $1`, [productId]);
  for (let i = 0; i < input.sizeOrder.length; i++) {
    await client.query(
      `INSERT INTO product_sizes (product_id, size, sort_order) VALUES ($1, $2, $3)`,
      [productId, input.sizeOrder[i], i]
    );
  }

  await client.query(`DELETE FROM new_drop_items WHERE product_id = $1`, [productId]);
  if (input.isNewDrop) {
    await client.query(
      `INSERT INTO new_drop_items (product_id, sort_order) VALUES ($1, $2)`,
      [productId, input.newDropSort]
    );
  }
}

export async function insertProduct(input: ProductMutationInput): Promise<number> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO products (name, price, variant_label, description, is_published)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [input.name, input.price, input.variantLabel, input.description, input.isPublished]
    );
    const id = rows[0].id;
    await replaceChildRows(client, id, input);
    await client.query("COMMIT");
    return id;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function updateProduct(id: number, input: ProductMutationInput): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  let pathsToUnlink: string[] = [];
  try {
    await client.query("BEGIN");
    const { rows: prevImg } = await client.query<{ path: string }>(
      `SELECT path FROM product_images WHERE product_id = $1`,
      [id]
    );
    const previousPaths = prevImg.map((r) => r.path);
    const nextSet = new Set(input.imagePaths);
    pathsToUnlink = previousPaths.filter((p) => !nextSet.has(p));

    const { rowCount } = await client.query(
      `UPDATE products SET
        name = $1,
        price = $2,
        variant_label = $3,
        description = $4,
        is_published = $5,
        updated_at = now()
       WHERE id = $6`,
      [input.name, input.price, input.variantLabel, input.description, input.isPublished, id]
    );
    if (!rowCount) {
      await client.query("ROLLBACK");
      pathsToUnlink = [];
      throw new Error("Producto no encontrado");
    }
    await replaceChildRows(client, id, input);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    pathsToUnlink = [];
    throw e;
  } finally {
    client.release();
  }
  for (const webPath of pathsToUnlink) {
    if (!isOwnedUploadPath(webPath)) continue;
    try {
      await unlink(absolutePublicPathFromWeb(webPath));
    } catch {
      /* archivo ya inexistente o sin permisos */
    }
  }
}

export async function deleteProduct(id: number): Promise<void> {
  const pool = getPool();
  await pool.query(`DELETE FROM products WHERE id = $1`, [id]);
}

export async function listProductImagePaths(productId: number): Promise<string[]> {
  const pool = getPool();
  const { rows } = await pool.query<{ path: string }>(
    `SELECT path FROM product_images WHERE product_id = $1`,
    [productId]
  );
  return rows.map((r) => r.path);
}

/** Elimina una fila de imagen. Devuelve true si existía. */
export async function deleteProductImageRow(
  productId: number,
  imagePath: string
): Promise<boolean> {
  const pool = getPool();
  const { rowCount } = await pool.query(
    `DELETE FROM product_images WHERE product_id = $1 AND path = $2`,
    [productId, imagePath]
  );
  return (rowCount ?? 0) > 0;
}

export function parseProductForm(form: FormData): ProductMutationInput {
  const name = String(form.get("name") ?? "").trim();
  const price = Number(String(form.get("price") ?? "0"));
  const variantLabel = String(form.get("variant_label") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const isPublished = form.get("is_published") === "on" || form.get("is_published") === "true";
  const fromMulti = form.getAll("images").map(String).map((s) => s.trim()).filter(Boolean);
  const imagesRaw = String(form.get("images") ?? "");
  const imagePaths =
    fromMulti.length > 0
      ? fromMulti
      : imagesRaw
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean);
  const colorsFromMulti = form.getAll("color_filters").map(String).map((s) => s.trim()).filter(Boolean);
  const colorsLegacy = String(form.get("color_filters_legacy") ?? "").trim();
  const colorFiltersMerged =
    colorsFromMulti.length > 0
      ? colorsFromMulti
      : colorsLegacy
          ? colorsLegacy
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
  const colorFilters = CATALOG_COLOR_FILTER_OPTIONS.filter((c) => colorFiltersMerged.includes(c));
  const sizesFromMulti = form.getAll("sizes").map(String).map((s) => s.trim()).filter(Boolean);
  const sizesRaw = String(form.get("sizes_legacy") ?? "").trim();
  const sizeOrder =
    sizesFromMulti.length > 0
      ? CATALOG_SIZE_ORDER.filter((s) => sizesFromMulti.includes(s))
      : sizesRaw
          ? sizesRaw
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
  const stockBySize: Record<string, number> = {};
  for (const size of CATALOG_SIZE_ORDER) {
    if (!sizeOrder.includes(size)) {
      stockBySize[size] = 0;
    } else {
      const v = form.get(`stock_${size}`);
      stockBySize[size] = Math.max(0, Math.floor(Number(v ?? 0)));
    }
  }
  const isNewDrop = form.get("is_new_drop") === "on" || form.get("is_new_drop") === "true";
  const newDropSort = Math.floor(Number(form.get("new_drop_sort") ?? "0"));
  return {
    name,
    price: Number.isFinite(price) ? price : 0,
    variantLabel,
    description,
    isPublished,
    imagePaths,
    colorFilters,
    sizeOrder,
    stockBySize,
    isNewDrop,
    newDropSort,
  };
}
