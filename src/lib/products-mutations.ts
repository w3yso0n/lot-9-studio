import { getPool } from "@/lib/db";
import { isOwnedUploadPath } from "@/lib/upload-products";
import { deletePanelUploadFile } from "@/lib/panel-upload-delete";
import { CATALOG_COLOR_FILTER_OPTIONS } from "@/lib/catalog-color-filters";
import { CATALOG_SIZE_ORDER } from "@/lib/catalog-sizes";
import type { PoolClient } from "pg";

export type ProductMutationInput = {
  name: string;
  price: number;
  oldPrice: number | null;
  variantLabel: string;
  description: string;
  isPublished: boolean;
  imagePaths: string[];
  coverImagePath: string;
  colorFilters: string[];
  sizeOrder: string[];
  stockBySize: Record<string, number>;
  variantProductIds: number[];
  colorVariants: {
    label: string;
    imagePaths: string[];
    stockBySize: Record<string, number>;
  }[];
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

  await client.query(`DELETE FROM product_color_variants WHERE product_id = $1`, [
    productId,
  ]);
  for (let i = 0; i < input.colorVariants.length; i++) {
    const variant = input.colorVariants[i];
    const imagePaths = variant.imagePaths.map((p) => p.trim()).filter(Boolean);
    if (imagePaths.length === 0) continue;
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO product_color_variants (product_id, label, image_path, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [productId, variant.label, imagePaths[0], i]
    );
    const colorVariantId = rows[0].id;

    for (let j = 0; j < imagePaths.length; j++) {
      await client.query(
        `INSERT INTO product_color_variant_images (color_variant_id, image_path, sort_order)
         VALUES ($1, $2, $3)`,
        [colorVariantId, imagePaths[j], j]
      );
    }

    for (const size of input.sizeOrder) {
      await client.query(
        `INSERT INTO product_color_variant_stock (color_variant_id, size, quantity)
         VALUES ($1, $2, $3)`,
        [
          colorVariantId,
          size,
          Math.max(0, Math.floor(variant.stockBySize[size] ?? 0)),
        ]
      );
    }
  }

  await client.query(
    `DELETE FROM product_variant_links
     WHERE product_id = $1 OR variant_product_id = $1`,
    [productId]
  );

  const variantIds = [...new Set(input.variantProductIds)]
    .filter((id) => Number.isFinite(id) && id > 0 && id !== productId);

  for (let i = 0; i < variantIds.length; i++) {
    const variantId = variantIds[i];
    await client.query(
      `INSERT INTO product_variant_links (product_id, variant_product_id, sort_order)
       VALUES ($1, $2, $3), ($2, $1, $3)
       ON CONFLICT (product_id, variant_product_id)
       DO UPDATE SET sort_order = EXCLUDED.sort_order`,
      [productId, variantId, i]
    );
  }
}

function firstProductImage(input: ProductMutationInput): string {
  return (
    input.colorVariants
      .flatMap((variant) => variant.imagePaths)
      .map((path) => path.trim())
      .find(Boolean) ??
    input.imagePaths.map((path) => path.trim()).find(Boolean) ??
    ""
  );
}

function resolveCoverImagePath(input: ProductMutationInput): string | null {
  const allImages = new Set([
    ...input.imagePaths.map((path) => path.trim()).filter(Boolean),
    ...input.colorVariants.flatMap((variant) =>
      variant.imagePaths.map((path) => path.trim()).filter(Boolean)
    ),
  ]);
  const requested = input.coverImagePath.trim();
  if (requested && allImages.has(requested)) return requested;
  return firstProductImage(input) || null;
}

export async function insertProduct(input: ProductMutationInput): Promise<number> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO products (
        name,
        price,
        old_price,
        variant_label,
        cover_image_path,
        description,
        is_published
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        input.name,
        input.price,
        input.oldPrice,
        input.variantLabel,
        resolveCoverImagePath(input),
        input.description,
        input.isPublished,
      ]
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
    const { rows: prevVariantImg } = await client.query<{ image_path: string }>(
      `SELECT pcv.image_path
       FROM product_color_variants pcv
       WHERE pcv.product_id = $1
       UNION
       SELECT pcvi.image_path
       FROM product_color_variant_images pcvi
       INNER JOIN product_color_variants pcv ON pcv.id = pcvi.color_variant_id
       WHERE pcv.product_id = $1`,
      [id]
    );
    const nextSet = new Set(input.imagePaths);
    const nextVariantSet = new Set(
      input.colorVariants.flatMap((v) => v.imagePaths)
    );
    pathsToUnlink = [
      ...previousPaths.filter((p) => !nextSet.has(p)),
      ...prevVariantImg
        .map((r) => r.image_path)
        .filter((p) => !nextVariantSet.has(p)),
    ];

    const { rowCount } = await client.query(
      `UPDATE products SET
        name = $1,
        price = $2,
        old_price = $3,
        variant_label = $4,
        cover_image_path = $5,
        description = $6,
        is_published = $7,
        updated_at = now()
       WHERE id = $8`,
      [
        input.name,
        input.price,
        input.oldPrice,
        input.variantLabel,
        resolveCoverImagePath(input),
        input.description,
        input.isPublished,
        id,
      ]
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
    await deletePanelUploadFile(webPath);
  }
}

export async function deleteProduct(id: number): Promise<void> {
  const pool = getPool();
  await pool.query(`DELETE FROM products WHERE id = $1`, [id]);
}

export async function listProductImagePaths(productId: number): Promise<string[]> {
  const pool = getPool();

  const { rows } = await pool.query<{ path: string }>(
    `SELECT path FROM product_images WHERE product_id = $1
     UNION
     SELECT pcv.image_path AS path
     FROM product_color_variants pcv
     WHERE pcv.product_id = $1
     UNION
     SELECT pcvi.image_path AS path
     FROM product_color_variant_images pcvi
     INNER JOIN product_color_variants pcv ON pcv.id = pcvi.color_variant_id
     WHERE pcv.product_id = $1`,
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

  if ((rowCount ?? 0) > 0) {
    await pool.query(
      `UPDATE products p
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
       WHERE p.id = $1 AND p.cover_image_path = $2`,
      [productId, imagePath]
    );
  }

  return (rowCount ?? 0) > 0;
}

export function parseProductForm(form: FormData): ProductMutationInput {
  const name = String(form.get("name") ?? "").trim();

  const priceRaw = String(form.get("price") ?? "0").replace(",", ".");
  const price = Number(priceRaw);

  const oldPriceRaw = String(form.get("old_price") ?? "").trim().replace(",", ".");
  const oldPriceNumber = Number(oldPriceRaw);
  const oldPrice =
    oldPriceRaw === "" || !Number.isFinite(oldPriceNumber) || oldPriceNumber <= 1
      ? null
      : oldPriceNumber;

  const variantLabel = String(form.get("variant_label") ?? "").trim();
  const coverImagePath = String(form.get("cover_image_path") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();

  const isPublished =
    form.get("is_published") === "on" || form.get("is_published") === "true";

  const fromMulti = form
    .getAll("images")
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);

  const imagesRaw = String(form.get("images") ?? "");

  const imagePaths =
    fromMulti.length > 0
      ? fromMulti
      : imagesRaw
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean);

  const colorsFromMulti = form
    .getAll("color_filters")
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);

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

  const colorFilters = CATALOG_COLOR_FILTER_OPTIONS.filter((c) =>
    colorFiltersMerged.includes(c)
  );

  const sizesFromMulti = form
    .getAll("sizes")
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);

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

  const variantProductIds = form
    .getAll("variant_product_ids")
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v > 0);

  const colorVariantLabels = form
    .getAll("color_variant_labels")
    .map(String)
    .map((s) => s.trim());
  const colorVariantImages = form
    .getAll("color_variant_images")
    .map(String)
    .map((s) => s.trim());
  const colorVariants = colorVariantLabels
    .map((label, index) => {
      const variantStockBySize: Record<string, number> = {};
      for (const size of CATALOG_SIZE_ORDER) {
        const raw = form.get(`color_variant_stock_${index}_${size}`);
        variantStockBySize[size] = Math.max(0, Math.floor(Number(raw ?? 0)));
      }

      return {
        label,
        imagePaths: (colorVariantImages[index] ?? "")
          .split("|")
          .map((s) => (s.trim() === "__pending__" ? "" : s.trim()))
          .filter(Boolean),
        stockBySize: variantStockBySize,
      };
    })
    .filter((variant) => variant.label || variant.imagePaths.length > 0);

  const aggregateStockBySize: Record<string, number> = { ...stockBySize };
  if (colorVariants.length > 0) {
    for (const size of CATALOG_SIZE_ORDER) {
      aggregateStockBySize[size] = colorVariants.reduce(
        (sum, variant) => sum + (variant.stockBySize[size] ?? 0),
        0
      );
    }
  }

  const resolvedVariantLabel =
    variantLabel || colorVariants[0]?.label || "Sin variante";

  return {
    name,
    price: Number.isFinite(price) ? price : 0,
    oldPrice,
    variantLabel: resolvedVariantLabel,
    description,
    isPublished,
    imagePaths,
    coverImagePath,
    colorFilters,
    sizeOrder,
    stockBySize: aggregateStockBySize,
    variantProductIds,
    colorVariants,
  };
}
