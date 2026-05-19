import type { CatalogProduct } from "@/lib/catalog-product";
import { CATALOG_SIZE_ORDER } from "@/lib/catalog-sizes";
import { getPool } from "@/lib/db";
import { sanitizeProductImagePaths } from "@/lib/product-image-url";
import { ensureProductVariantsSchema } from "@/lib/product-variants-schema";
import { unstable_cache } from "next/cache";
import type { QueryResultRow } from "pg";

type ProductRow = QueryResultRow & {
  id: number;
  name: string;
  price: string | number;
  old_price?: string | number | null;
  color: string;
  product_desc: string;
  images: unknown;
  stock_by_size: unknown;
  sizes: unknown;
  colors: unknown;
};

type CatalogGridRow = QueryResultRow & {
  id: number;
  name: string;
  price: string | number;
  old_price?: string | number | null;
  color: string;
  cover_image: string | null;
  stock_by_size: unknown;
};

type NewDropRow = QueryResultRow & {
  id: number;
  name: string;
  price: string | number;
  old_price?: string | number | null;
  color: string;
  images: unknown;
  stock_by_size: unknown;
  sizes: unknown;
};

type AdminListRow = QueryResultRow & {
  id: number;
  name: string;
  price: string | number;
  old_price?: string | number | null;
  color: string;
  cover_image: string | null;
  is_published: boolean;
  new_drop_sort: number | null;
};

type ProductVariantRow = QueryResultRow & {
  id: number;
  name: string;
  color: string;
  image: string | null;
};

type AdminVariantOptionRow = ProductVariantRow & {
  is_selected: boolean;
};

type ProductColorVariantRow = QueryResultRow & {
  id: number;
  label: string;
  image_path: string;
  images: unknown;
  stock_by_size: unknown;
};

function parseJsonArray(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map(String);
  return [];
}

function parseStock(v: unknown): Record<string, number> {
  if (v == null || typeof v !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    const n = Number(val);
    if (!Number.isNaN(n)) out[k] = n;
  }
  return out;
}

function normalizeSizes(
  sizesFromDb: string[],
  stock: Record<string, number>
): string[] {
  if (sizesFromDb.length > 0) return sizesFromDb;
  const keys = Object.keys(stock);
  return [
    ...CATALOG_SIZE_ORDER.filter((s) => keys.includes(s)),
    ...keys.filter((k) => !(CATALOG_SIZE_ORDER as readonly string[]).includes(k)),
  ];
}

function rowToProduct(row: ProductRow): CatalogProduct {
  const stockBySize = parseStock(row.stock_by_size);
  const sizes = normalizeSizes(parseJsonArray(row.sizes), stockBySize);
  const price = typeof row.price === "string" ? parseFloat(row.price) : row.price;
  return {
    id: row.id,
    code: row.id,
    name: row.name,
    price: Number.isFinite(price) ? price : 0,
    oldPrice: parseOldPrice(row.old_price),
    color: row.color,
    images: sanitizeProductImagePaths(parseJsonArray(row.images)),
    stockBySize,
    sizes,
    colors: parseJsonArray(row.colors),
    desc: row.product_desc ?? "",
  };
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

async function getColorVariantsForProduct(productId: number) {
  const pool = getPool();
  await ensureProductVariantsSchema(pool);
  const { rows } = await pool.query<ProductColorVariantRow>(
    `SELECT
       pcv.id,
       pcv.label,
       pcv.image_path,
       COALESCE(
         (SELECT json_agg(pcvi.image_path ORDER BY pcvi.sort_order, pcvi.id)
          FROM product_color_variant_images pcvi
          WHERE pcvi.color_variant_id = pcv.id),
         '[]'::json
       ) AS images,
       COALESCE(
         (SELECT json_object_agg(pcvs.size, pcvs.quantity)
          FROM product_color_variant_stock pcvs
          WHERE pcvs.color_variant_id = pcv.id),
         '{}'::json
       ) AS stock_by_size
     FROM product_color_variants pcv
     WHERE pcv.product_id = $1
     ORDER BY pcv.sort_order, pcv.id`,
    [productId]
  );

  return rows
    .map((row) => {
      const fromGallery = sanitizeProductImagePaths(parseJsonArray(row.images));
      const images =
        fromGallery.length > 0
          ? fromGallery
          : sanitizeProductImagePaths([row.image_path]);
      return {
        label: row.label,
        images,
        stockBySize: parseStock(row.stock_by_size),
      };
    })
    .filter((row) => row.images.length > 0);
}

function rowToCatalogGridProduct(row: CatalogGridRow): CatalogProduct {
  const stockBySize = parseStock(row.stock_by_size);
  const sizes = normalizeSizes([], stockBySize);
  const price = typeof row.price === "string" ? parseFloat(row.price) : row.price;
  const cover = row.cover_image == null ? "" : String(row.cover_image);
  return {
    id: row.id,
    code: row.id,
    name: row.name,
    price,
    oldPrice: parseOldPrice(row.old_price),
    color: row.color,
    images: cover ? [cover] : [],
    stockBySize,
    sizes,
    colors: [],
    desc: "",
  };
}

function rowToNewDropProduct(row: NewDropRow): CatalogProduct {
  const stockBySize = parseStock(row.stock_by_size);
  const sizes = normalizeSizes(parseJsonArray(row.sizes), stockBySize);
  const price = typeof row.price === "string" ? parseFloat(row.price) : row.price;
  return {
    id: row.id,
    code: row.id,
    name: row.name,
    price,
    oldPrice: parseOldPrice(row.old_price),
    color: row.color,
    images: parseJsonArray(row.images),
    stockBySize,
    sizes,
    colors: [],
    desc: "",
  };
}

const productSelectList = `
  p.id,
  p.name,
  p.price,
  p.old_price,
  p.variant_label AS color,
  COALESCE(p.description, '') AS product_desc,
  COALESCE(
    (SELECT json_agg(pi.path ORDER BY pi.sort_order, pi.id)
     FROM product_images pi WHERE pi.product_id = p.id),
    '[]'::json
  ) AS images,
  COALESCE(
    (SELECT json_object_agg(ps.size, ps.quantity)
     FROM product_stock ps WHERE ps.product_id = p.id),
    '{}'::json
  ) AS stock_by_size,
  COALESCE(
    (SELECT json_agg(sz.size ORDER BY sz.sort_order, sz.size)
     FROM product_sizes sz WHERE sz.product_id = p.id),
    '[]'::json
  ) AS sizes,
  COALESCE(
    (SELECT json_agg(f.filter_value ORDER BY f.filter_value)
     FROM product_color_filters f WHERE f.product_id = p.id),
    '[]'::json
  ) AS colors
`;

const productSelect = `SELECT ${productSelectList} FROM products p`;

/** Grid tienda: portada + stock (sin descripción ni filtros ni tallas en SQL). */
async function fetchCatalogProductsGrid(): Promise<CatalogProduct[]> {
  const pool = getPool();
  const { rows } = await pool.query<CatalogGridRow>(
    `SELECT
       p.id,
       p.name,
       p.price,
       p.old_price,
       p.variant_label AS color,
       (SELECT pi.path
        FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order, pi.id
        LIMIT 1) AS cover_image,
       COALESCE(
         (SELECT json_object_agg(ps.size, ps.quantity)
          FROM product_stock ps WHERE ps.product_id = p.id),
         '{}'::json
       ) AS stock_by_size
     FROM products p
     WHERE p.is_published = true
     ORDER BY p.id DESC`
  );
  return rows.map(rowToCatalogGridProduct);
}

export const getCatalogProducts = unstable_cache(fetchCatalogProductsGrid, ["catalog-products-grid"], {
  revalidate: 60,
  tags: ["catalog"],
});

/** Nuevos drops: todas las imágenes + stock/tallas; sin descripción ni filtros de color. */
async function fetchNewDrops(): Promise<CatalogProduct[]> {
  const pool = getPool();
  const { rows } = await pool.query<NewDropRow>(
    `SELECT
       p.id,
       p.name,
       p.price,
       p.old_price,
       p.variant_label AS color,
       COALESCE(
         (SELECT json_agg(pi.path ORDER BY pi.sort_order, pi.id)
          FROM product_images pi WHERE pi.product_id = p.id),
         '[]'::json
       ) AS images,
       COALESCE(
         (SELECT json_object_agg(ps.size, ps.quantity)
          FROM product_stock ps WHERE ps.product_id = p.id),
         '{}'::json
       ) AS stock_by_size,
       COALESCE(
         (SELECT json_agg(sz.size ORDER BY sz.sort_order, sz.size)
          FROM product_sizes sz WHERE sz.product_id = p.id),
         '[]'::json
       ) AS sizes
     FROM products p
     INNER JOIN new_drop_items nd ON nd.product_id = p.id
     WHERE p.is_published = true
     ORDER BY nd.sort_order ASC, p.id DESC`
  );
  return rows.map(rowToNewDropProduct);
}

export const getNewDrops = unstable_cache(fetchNewDrops, ["catalog-new-drops"], {
  revalidate: 60,
  tags: ["catalog"],
});

async function fetchProductById(
  id: number,
  opts?: { includeUnpublished?: boolean }
): Promise<CatalogProduct | null> {
  const pool = getPool();
  await ensureProductVariantsSchema(pool);
  const pub = opts?.includeUnpublished ? "" : "AND p.is_published = true";
  const { rows } = await pool.query<ProductRow>(
    `${productSelect}
     WHERE p.id = $1 ${pub}`,
    [id]
  );
  if (!rows[0]) return null;
  const product = rowToProduct(rows[0]);
  const { rows: variants } = await pool.query<ProductVariantRow>(
    `SELECT
       vp.id,
       vp.name,
       vp.variant_label AS color,
       (SELECT pi.path
        FROM product_images pi
        WHERE pi.product_id = vp.id
        ORDER BY pi.sort_order, pi.id
        LIMIT 1) AS image
     FROM product_variant_links v
     INNER JOIN products vp ON vp.id = v.variant_product_id
     WHERE v.product_id = $1
       AND vp.is_published = true
     ORDER BY v.sort_order, vp.id`,
    [id]
  );
  const colorVariants = await getColorVariantsForProduct(id);
  const sizes =
    product.sizes.length > 0
      ? product.sizes
      : normalizeSizes([], product.stockBySize);
  return {
    ...product,
    sizes,
    variants: variants.map((v) => ({
      id: v.id,
      name: v.name,
      color: v.color,
      image: v.image?.trim() ?? "",
    })),
    colorVariants,
  };
}

function getCachedStorefrontProductById(id: number) {
  return unstable_cache(
    () => fetchProductById(id),
    ["catalog-product-detail", String(id)],
    { revalidate: 60, tags: ["catalog", `product-${id}`] }
  )();
}

export async function getProductById(
  id: number,
  opts?: { includeUnpublished?: boolean }
): Promise<CatalogProduct | null> {
  if (opts?.includeUnpublished) {
    return fetchProductById(id, opts);
  }
  return getCachedStorefrontProductById(id);
}

export type AdminProductRow = CatalogProduct & {
  is_published: boolean;
  new_drop_sort: number | null;
  variantProductIds: number[];
};

/** Listado admin: solo datos de tarjeta (portada + precio + estado). */
export type AdminProductListItem = {
  id: number;
  name: string;
  price: number;
  oldPrice?: number | null;
  color: string;
  images: string[];
  is_published: boolean;
  new_drop_sort: number | null;
};

export async function getAdminProductList(): Promise<AdminProductListItem[]> {
  const pool = getPool();
  const { rows } = await pool.query<AdminListRow>(
    `SELECT
       p.id,
       p.name,
       p.price,
       p.old_price,
       p.variant_label AS color,
       p.is_published,
       (SELECT nd.sort_order FROM new_drop_items nd WHERE nd.product_id = p.id LIMIT 1) AS new_drop_sort,
       (SELECT pi.path
        FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order, pi.id
        LIMIT 1) AS cover_image
     FROM products p
     ORDER BY p.id DESC`
  );
  return rows.map((row) => {
    const price = typeof row.price === "string" ? parseFloat(row.price) : row.price;
    const oldPrice =
      row.old_price == null
        ? undefined
        : typeof row.old_price === "string"
        ? parseFloat(row.old_price)
        : row.old_price;
    const cover = row.cover_image == null ? "" : String(row.cover_image);
    return {
      id: row.id,
      name: row.name,
      price,
      oldPrice,
      color: row.color,
      images: cover ? [cover] : [],
      is_published: row.is_published,
      new_drop_sort: row.new_drop_sort,
    };
  });
}

export async function getAdminProductById(id: number): Promise<AdminProductRow | null> {
  const pool = getPool();
  await ensureProductVariantsSchema(pool);
  const { rows } = await pool.query<
    ProductRow & { is_published: boolean; new_drop_sort: number | null }
  >(
    `SELECT ${productSelectList},
      p.is_published,
      (SELECT nd.sort_order FROM new_drop_items nd WHERE nd.product_id = p.id) AS new_drop_sort
     FROM products p
     WHERE p.id = $1`,
    [id]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  const { rows: variantRows } = await pool.query<{ variant_product_id: number }>(
    `SELECT variant_product_id
     FROM product_variant_links
     WHERE product_id = $1
     ORDER BY sort_order, variant_product_id`,
    [id]
  );
  return {
    ...rowToProduct(row),
    is_published: row.is_published,
    new_drop_sort: row.new_drop_sort,
    variantProductIds: variantRows.map((r) => r.variant_product_id),
    colorVariants: await getColorVariantsForProduct(id),
  };
}

export type AdminProductVariantOption = {
  id: number;
  name: string;
  color: string;
  image: string;
  isSelected: boolean;
};

export async function getAdminProductVariantOptions(
  productId?: number
): Promise<AdminProductVariantOption[]> {
  const pool = getPool();
  await ensureProductVariantsSchema(pool);

  const id = productId ?? 0;
  const { rows } = await pool.query<AdminVariantOptionRow>(
    `SELECT
       p.id,
       p.name,
       p.variant_label AS color,
       (SELECT pi.path
        FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order, pi.id
        LIMIT 1) AS image,
       EXISTS (
         SELECT 1
         FROM product_variant_links v
         WHERE v.product_id = $1 AND v.variant_product_id = p.id
       ) AS is_selected
     FROM products p
     WHERE p.id <> $1
     ORDER BY p.name ASC, p.variant_label ASC, p.id ASC`,
    [id]
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    image: row.image ?? "",
    isSelected: row.is_selected,
  }));
}
