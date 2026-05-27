-- Portada única por producto.
-- Mantiene compatibilidad: si no hay portada manual, usa la primera imagen actual.

BEGIN;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cover_image_path TEXT;

UPDATE products p
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
WHERE p.cover_image_path IS NULL;

COMMIT;
