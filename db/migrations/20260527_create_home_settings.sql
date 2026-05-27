-- Configuración editable del home de Lot-9 Studio.
-- Una sola fila: id = 1.

BEGIN;

CREATE TABLE IF NOT EXISTS home_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hero_title TEXT NOT NULL DEFAULT '',
  hero_subtitle TEXT NOT NULL DEFAULT '',
  hero_button_text TEXT NOT NULL DEFAULT '',
  hero_button_href TEXT NOT NULL DEFAULT '/products',
  hero_image_url TEXT,
  featured_video_url TEXT,
  is_hero_enabled BOOLEAN NOT NULL DEFAULT true,
  is_video_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO home_settings (
  id,
  hero_title,
  hero_subtitle,
  hero_button_text,
  hero_button_href,
  hero_image_url,
  featured_video_url,
  is_hero_enabled,
  is_video_enabled
)
VALUES (
  1,
  'NO\nTODOS\nLO\nENTENDERAN',
  'LOT9_STUDIO_GUADALAJARA',
  'Descubre la colección',
  '#catalogo',
  '/images/background.png',
  '/video1.mp4',
  true,
  true
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
