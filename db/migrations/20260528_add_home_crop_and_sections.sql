BEGIN;

ALTER TABLE home_settings
  ADD COLUMN IF NOT EXISTS hero_crop_x NUMERIC(6, 2) NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS hero_crop_y NUMERIC(6, 2) NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS hero_crop_zoom NUMERIC(6, 3) NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS home_sections (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_home_sections_enabled_sort
  ON home_sections (is_enabled, sort_order, id);

COMMIT;
