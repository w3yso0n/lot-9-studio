-- Imagen alternativa única para hover/tap del catálogo.
-- Se guarda a nivel producto para cubrir imágenes legacy y de variantes/color.

BEGIN;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS hover_image_path TEXT;

COMMIT;
