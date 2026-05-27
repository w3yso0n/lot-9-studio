-- Imagen seleccionada para cada producto dentro del carrusel New Drops.
-- Conserva los registros existentes y permite fallback si queda NULL.

BEGIN;

ALTER TABLE new_drop_items
  ADD COLUMN IF NOT EXISTS selected_image_path TEXT;

COMMIT;
