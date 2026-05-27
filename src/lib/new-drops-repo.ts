import { getPool } from "@/lib/db";
import { sanitizeProductImagePaths } from "@/lib/product-image-url";
import type { QueryResultRow } from "pg";

export type AdminNewDropProduct = {
  id: number;
  name: string;
  color: string;
  price: number;
  oldPrice?: number | null;
  isPublished: boolean;
  isSelected: boolean;
  sortOrder: number;
  selectedImagePath: string;
  fallbackImagePath: string;
  images: string[];
};

type AdminNewDropRow = QueryResultRow & {
  id: number;
  name: string;
  color: string;
  price: string | number;
  old_price?: string | number | null;
  is_published: boolean;
  sort_order: number | null;
  selected_image_path: string | null;
  fallback_image_path: string | null;
  images: unknown;
};

function parseJsonArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  return [];
}

function parseOldPrice(value: unknown): number | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (typeof value === "number") return value;
  return undefined;
}

const firstColorVariantImageSql = `
  (SELECT COALESCE(pcvi.image_path, pcv.image_path)
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
   LIMIT 1)`;

const fallbackProductCoverSql = `
  COALESCE(
    NULLIF(p.cover_image_path, ''),
    ${firstColorVariantImageSql},
    (SELECT pi.path
     FROM product_images pi
     WHERE pi.product_id = p.id
     ORDER BY pi.sort_order, pi.id
     LIMIT 1)
  )`;

export async function getAdminNewDropProducts(): Promise<AdminNewDropProduct[]> {
  const pool = getPool();
  const { rows } = await pool.query<AdminNewDropRow>(
    `SELECT
       p.id,
       p.name,
       p.variant_label AS color,
       p.price,
       p.old_price,
       p.is_published,
       nd.sort_order,
       nd.selected_image_path,
       ${fallbackProductCoverSql} AS fallback_image_path,
       COALESCE(img.images, '[]'::json) AS images
     FROM products p
     LEFT JOIN new_drop_items nd ON nd.product_id = p.id
     LEFT JOIN LATERAL (
       SELECT json_agg(image_path ORDER BY bucket, sort_order, id) AS images
       FROM (
         SELECT 0 AS bucket, 0 AS sort_order, 0 AS id, NULLIF(p.cover_image_path, '') AS image_path
         UNION ALL
         SELECT 1 AS bucket, pcv.sort_order, pcv.id, pcv.image_path
         FROM product_color_variants pcv
         WHERE pcv.product_id = p.id
         UNION ALL
         SELECT 2 AS bucket, pcvi.sort_order, pcvi.id, pcvi.image_path
         FROM product_color_variant_images pcvi
         INNER JOIN product_color_variants pcv ON pcv.id = pcvi.color_variant_id
         WHERE pcv.product_id = p.id
         UNION ALL
         SELECT 3 AS bucket, pi.sort_order, pi.id, pi.path
         FROM product_images pi
         WHERE pi.product_id = p.id
       ) all_images
       WHERE image_path IS NOT NULL AND image_path <> ''
     ) img ON true
     ORDER BY
       CASE WHEN nd.product_id IS NULL THEN 1 ELSE 0 END,
       nd.sort_order,
       p.id DESC`
  );

  return rows.map((row, index) => {
    const images = [...new Set(sanitizeProductImagePaths(parseJsonArray(row.images)))];
    const fallback = sanitizeProductImagePaths([row.fallback_image_path ?? ""])[0] ?? "";
    const selected =
      sanitizeProductImagePaths([row.selected_image_path ?? ""])[0] ??
      fallback;
    const price = typeof row.price === "string" ? parseFloat(row.price) : row.price;
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      price: Number.isFinite(price) ? price : 0,
      oldPrice: parseOldPrice(row.old_price),
      isPublished: row.is_published,
      isSelected: row.sort_order != null,
      sortOrder: row.sort_order ?? index,
      selectedImagePath: selected,
      fallbackImagePath: fallback,
      images: images.length > 0 ? images : fallback ? [fallback] : [],
    };
  });
}
