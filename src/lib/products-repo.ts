import type {
  CatalogProduct,
  CatalogProductColorVariant,
} from "@/lib/catalog-product";
import { CATALOG_SIZE_ORDER } from "@/lib/catalog-sizes";
import { getPool } from "@/lib/db";
import { sanitizeProductImagePaths } from "@/lib/product-image-url";
import { unstable_cache } from "next/cache";
import type { QueryResultRow } from "pg";

type ProductRow = QueryResultRow & {
  id: number;
  name: string;
  price: string | number;
  old_price?: string | number | null;
  color: string;
  cover_image?: string | null;
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
  in_stock: boolean;
};

type NewDropRow = QueryResultRow & {
  id: number;
  name: string;
  price: string | number;
  old_price?: string | number | null;
  color: string;
  cover_image: string | null;
  images: unknown;
  in_stock: boolean;
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
  const cover = sanitizeProductImagePaths([row.cover_image ?? ""])[0] ?? null;
  return {
    id: row.id,
    code: row.id,
    name: row.name,
    price: Number.isFinite(price) ? price : 0,
    oldPrice: parseOldPrice(row.old_price),
    color: row.color,
    images: sanitizeProductImagePaths(parseJsonArray(row.images)),
    coverImage: cover,
    stockBySize,
    sizes,
    colors: parseJsonArray(row.colors),
    desc: row.product_desc ?? "",
  };
}

function prioritizeCoverImage(images: string[], coverImage?: string | null): string[] {
  const sanitized = sanitizeProductImagePaths(images);
  const cover = sanitizeProductImagePaths([coverImage ?? ""])[0];
  if (!cover) return sanitized;
  return [cover, ...sanitized.filter((image) => image !== cover)];
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

function mapColorVariantRows(
  rows: Array<{
    label: string;
    image_path?: string;
    images: unknown;
    stock_by_size: unknown;
  }>
): CatalogProductColorVariant[] {
  return rows
    .map((row) => {
      const fromGallery = sanitizeProductImagePaths(parseJsonArray(row.images));
      const images =
        fromGallery.length > 0
          ? fromGallery
          : sanitizeProductImagePaths([row.image_path ?? ""]);
      return {
        label: row.label,
        images,
        stockBySize: parseStock(row.stock_by_size),
      };
    })
    .filter((row) => row.images.length > 0);
}

function parseColorVariantsAgg(raw: unknown): CatalogProductColorVariant[] {
  if (!Array.isArray(raw)) return [];
  return mapColorVariantRows(
    raw.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        label: String(row.label ?? ""),
        image_path: String(row.image_path ?? ""),
        images: row.images,
        stock_by_size: row.stock_by_size,
      };
    })
  );
}

const colorVariantsAggSql = `
  COALESCE((
    SELECT json_agg(
      json_build_object(
        'label', pcv.label,
        'image_path', pcv.image_path,
        'images', COALESCE(img.images, '[]'::json),
        'stock_by_size', COALESCE(stk.stock_by_size, '{}'::json)
      )
      ORDER BY pcv.sort_order, pcv.id
    )
    FROM product_color_variants pcv
    LEFT JOIN LATERAL (
      SELECT json_agg(pcvi.image_path ORDER BY pcvi.sort_order, pcvi.id) AS images
      FROM product_color_variant_images pcvi
      WHERE pcvi.color_variant_id = pcv.id
    ) img ON true
    LEFT JOIN LATERAL (
      SELECT json_object_agg(pcvs.size, pcvs.quantity) AS stock_by_size
      FROM product_color_variant_stock pcvs
      WHERE pcvs.color_variant_id = pcv.id
    ) stk ON true
    WHERE pcv.product_id = p.id
  ), '[]'::json) AS color_variants_agg`;

async function getColorVariantsForProduct(
  productId: number
): Promise<CatalogProductColorVariant[]> {
  const pool = getPool();
  const { rows } = await pool.query<ProductColorVariantRow>(
    `SELECT
       pcv.label,
       pcv.image_path,
       COALESCE(img.images, '[]'::json) AS images,
       COALESCE(stk.stock_by_size, '{}'::json) AS stock_by_size
     FROM product_color_variants pcv
     LEFT JOIN LATERAL (
       SELECT json_agg(pcvi.image_path ORDER BY pcvi.sort_order, pcvi.id) AS images
       FROM product_color_variant_images pcvi
       WHERE pcvi.color_variant_id = pcv.id
     ) img ON true
     LEFT JOIN LATERAL (
       SELECT json_object_agg(pcvs.size, pcvs.quantity) AS stock_by_size
       FROM product_color_variant_stock pcvs
       WHERE pcvs.color_variant_id = pcv.id
     ) stk ON true
     WHERE pcv.product_id = $1
     ORDER BY pcv.sort_order, pcv.id`,
    [productId]
  );
  return mapColorVariantRows(rows);
}

function rowToCatalogGridProduct(row: CatalogGridRow): CatalogProduct {
  const price = typeof row.price === "string" ? parseFloat(row.price) : row.price;
  const cover = row.cover_image == null ? "" : String(row.cover_image);
  return {
    id: row.id,
    code: row.id,
    name: row.name,
    price: Number.isFinite(price) ? price : 0,
    oldPrice: parseOldPrice(row.old_price),
    color: row.color,
    images: sanitizeProductImagePaths(cover ? [cover] : []),
    coverImage: cover || null,
    stockBySize: {},
    sizes: [],
    colors: [],
    desc: "",
    inStock: row.in_stock,
  };
}

function rowToNewDropProduct(row: NewDropRow): CatalogProduct {
  const price = typeof row.price === "string" ? parseFloat(row.price) : row.price;
  const cover = row.cover_image == null ? "" : String(row.cover_image);
  return {
    id: row.id,
    code: row.id,
    name: row.name,
    price: Number.isFinite(price) ? price : 0,
    oldPrice: parseOldPrice(row.old_price),
    color: row.color,
    images: prioritizeCoverImage(parseJsonArray(row.images), cover),
    coverImage: cover || null,
    stockBySize: {},
    sizes: [],
    colors: [],
    desc: "",
    inStock: row.in_stock,
  };
}

const productSelectList = `
  p.id,
  p.name,
  p.price,
  p.old_price,
  p.variant_label AS color,
  p.cover_image_path AS cover_image,
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

const catalogGridSql = `
  SELECT
    p.id,
    p.name,
    p.price,
    p.old_price,
    p.variant_label AS color,
    ${fallbackProductCoverSql} AS cover_image,
    EXISTS (
      SELECT 1 FROM product_stock ps
      WHERE ps.product_id = p.id AND ps.quantity > 0
    ) AS in_stock
  FROM products p
  WHERE p.is_published = true
  ORDER BY p.id DESC`;

const newDropsSql = `
  SELECT
    p.id,
    p.name,
    p.price,
    p.old_price,
    p.variant_label AS color,
    ${fallbackProductCoverSql} AS cover_image,
    COALESCE(
      CASE
        WHEN EXISTS (SELECT 1 FROM product_color_variants pcv WHERE pcv.product_id = p.id)
        THEN (
          SELECT json_agg(pcvi.image_path ORDER BY pcvi.sort_order, pcvi.id)
          FROM product_color_variants pcv
          INNER JOIN product_color_variant_images pcvi ON pcvi.color_variant_id = pcv.id
          WHERE pcv.product_id = p.id
            AND pcv.id = (
              SELECT pcv_first.id
              FROM product_color_variants pcv_first
              WHERE pcv_first.product_id = p.id
              ORDER BY pcv_first.sort_order, pcv_first.id
              LIMIT 1
            )
        )
        ELSE (
          SELECT json_agg(pi.path ORDER BY pi.sort_order, pi.id)
          FROM product_images pi WHERE pi.product_id = p.id
        )
      END,
      '[]'::json
    ) AS images,
    EXISTS (
      SELECT 1 FROM product_stock ps
      WHERE ps.product_id = p.id AND ps.quantity > 0
    ) AS in_stock
  FROM products p
  INNER JOIN new_drop_items nd ON nd.product_id = p.id
  WHERE p.is_published = true
  ORDER BY nd.sort_order ASC, p.id DESC`;

export type StorefrontHomeData = {
  products: CatalogProduct[];
  newDrops: CatalogProduct[];
};

/** Una conexión, dos consultas en paralelo (home y /products). */
async function fetchStorefrontHomeData(): Promise<StorefrontHomeData> {
  const pool = getPool();
  const [grid, drops] = await Promise.all([
    pool.query<CatalogGridRow>(catalogGridSql),
    pool.query<NewDropRow>(newDropsSql),
  ]);
  return {
    products: grid.rows.map(rowToCatalogGridProduct),
    newDrops: drops.rows.map(rowToNewDropProduct),
  };
}

export const getStorefrontHomeData = unstable_cache(
  fetchStorefrontHomeData,
  ["storefront-home"],
  { revalidate: 60, tags: ["catalog"] }
);

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  return (await getStorefrontHomeData()).products;
}

export async function getNewDrops(): Promise<CatalogProduct[]> {
  return (await getStorefrontHomeData()).newDrops;
}

const productDetailSelectList = `
  p.id,
  p.name,
  p.price,
  p.old_price,
  p.variant_label AS color,
  p.cover_image_path AS cover_image,
  COALESCE(p.description, '') AS product_desc,
  COALESCE(
  CASE
    WHEN EXISTS (SELECT 1 FROM product_color_variants pcv WHERE pcv.product_id = p.id)
    THEN '[]'::json
    ELSE (
      SELECT json_agg(pi.path ORDER BY pi.sort_order, pi.id)
      FROM product_images pi WHERE pi.product_id = p.id
    )
  END,
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
`;

async function fetchLinkedVariants(
  pool: ReturnType<typeof getPool>,
  id: number
): Promise<CatalogProduct["variants"]> {
  const { rows } = await pool.query<ProductVariantRow>(
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
  return rows.map((v) => ({
    id: v.id,
    name: v.name,
    color: v.color,
    image: v.image?.trim() ?? "",
  }));
}

async function fetchProductById(
  id: number,
  opts?: { includeUnpublished?: boolean }
): Promise<CatalogProduct | null> {
  const pool = getPool();
  const pub = opts?.includeUnpublished ? "" : "AND p.is_published = true";
  const { rows } = await pool.query<
    ProductRow & { color_variants_agg: unknown }
  >(
    `SELECT ${productDetailSelectList}, ${colorVariantsAggSql}
     FROM products p
     WHERE p.id = $1 ${pub}`,
    [id]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  const product = rowToProduct(row);
  const colorVariants = parseColorVariantsAgg(row.color_variants_agg);
  const hasColorVariants = colorVariants.length > 0;

  const variants = hasColorVariants
    ? undefined
    : await fetchLinkedVariants(pool, id);

  const sizes =
    product.sizes.length > 0
      ? product.sizes
      : hasColorVariants
        ? normalizeSizes(
            [],
            colorVariants.reduce<Record<string, number>>((acc, variant) => {
              for (const [size, qty] of Object.entries(variant.stockBySize)) {
                acc[size] = (acc[size] ?? 0) + qty;
              }
              return acc;
            }, {})
          )
        : normalizeSizes([], product.stockBySize);

  return {
    ...product,
    sizes,
    variants,
    colorVariants: hasColorVariants ? colorVariants : undefined,
  };
}

const productDetailCache = new Map<
  number,
  () => Promise<CatalogProduct | null>
>();

function getCachedStorefrontProductById(id: number): Promise<CatalogProduct | null> {
  let cached = productDetailCache.get(id);
  if (!cached) {
    cached = unstable_cache(
      () => fetchProductById(id),
      ["catalog-product-detail", String(id)],
      { revalidate: 60, tags: ["catalog", `product-${id}`] }
    );
    productDetailCache.set(id, cached);
  }
  return cached();
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
       ${fallbackProductCoverSql} AS cover_image
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
  const [{ rows: variantRows }, colorVariants] = await Promise.all([
    pool.query<{ variant_product_id: number }>(
      `SELECT variant_product_id
       FROM product_variant_links
       WHERE product_id = $1
       ORDER BY sort_order, variant_product_id`,
      [id]
    ),
    getColorVariantsForProduct(id),
  ]);
  return {
    ...rowToProduct(row),
    is_published: row.is_published,
    new_drop_sort: row.new_drop_sort,
    variantProductIds: variantRows.map((r) => r.variant_product_id),
    colorVariants,
  };
}
