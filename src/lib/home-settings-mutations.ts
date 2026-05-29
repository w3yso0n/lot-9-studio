import { getPool } from "@/lib/db";
import { ensureHomeSchema } from "@/lib/home-schema";
import { DEFAULT_HOME_SETTINGS, type HomeSettings } from "@/lib/home-settings";

export type HomeSettingsMutationInput = HomeSettings;

export function normalizeHomeHref(value: string): string {
  const href = value.trim();
  if (!href) return DEFAULT_HOME_SETTINGS.heroButtonHref;
  if (
    href.startsWith("/") ||
    href.startsWith("#") ||
    href.startsWith("https://") ||
    href.startsWith("http://")
  ) {
    return href;
  }
  return `/${href.replace(/^\/+/, "")}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export async function upsertHomeSettings(
  input: HomeSettingsMutationInput
): Promise<void> {
  await ensureHomeSchema();
  const pool = getPool();
  await pool.query(
    `INSERT INTO home_settings (
       id,
       hero_title,
       hero_subtitle,
       hero_button_text,
       hero_button_href,
       hero_image_url,
       hero_crop_x,
       hero_crop_y,
       hero_crop_zoom,
       featured_video_url,
       is_hero_enabled,
       is_video_enabled,
       updated_at
     )
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
     ON CONFLICT (id)
     DO UPDATE SET
       hero_title = EXCLUDED.hero_title,
       hero_subtitle = EXCLUDED.hero_subtitle,
       hero_button_text = EXCLUDED.hero_button_text,
       hero_button_href = EXCLUDED.hero_button_href,
       hero_image_url = EXCLUDED.hero_image_url,
       hero_crop_x = EXCLUDED.hero_crop_x,
       hero_crop_y = EXCLUDED.hero_crop_y,
       hero_crop_zoom = EXCLUDED.hero_crop_zoom,
       featured_video_url = EXCLUDED.featured_video_url,
       is_hero_enabled = EXCLUDED.is_hero_enabled,
       is_video_enabled = EXCLUDED.is_video_enabled,
       updated_at = now()`,
    [
      input.heroTitle.trim() || DEFAULT_HOME_SETTINGS.heroTitle,
      input.heroSubtitle.trim() || DEFAULT_HOME_SETTINGS.heroSubtitle,
      input.heroButtonText.trim() || DEFAULT_HOME_SETTINGS.heroButtonText,
      normalizeHomeHref(input.heroButtonHref),
      input.heroImageUrl.trim() || DEFAULT_HOME_SETTINGS.heroImageUrl,
      clamp(Number(input.heroCropX), 0, 100),
      clamp(Number(input.heroCropY), 0, 100),
      clamp(Number(input.heroCropZoom), 1, 3),
      input.featuredVideoUrl.trim() || DEFAULT_HOME_SETTINGS.featuredVideoUrl,
      input.isHeroEnabled,
      input.isVideoEnabled,
    ]
  );

  // Sincronizar con la sección hero del constructor si existe
  await pool.query(
    `UPDATE home_sections SET
      title = $1,
      subtitle = $2,
      content = content || $9::jsonb,
      updated_at = now()
     WHERE type = 'hero' AND is_enabled = true
     LIMIT 1`,
    [
      input.heroTitle.trim() || DEFAULT_HOME_SETTINGS.heroTitle,
      input.heroSubtitle.trim() || DEFAULT_HOME_SETTINGS.heroSubtitle,
      input.heroButtonText.trim() || DEFAULT_HOME_SETTINGS.heroButtonText,
      normalizeHomeHref(input.heroButtonHref),
      input.heroImageUrl.trim() || DEFAULT_HOME_SETTINGS.heroImageUrl,
      clamp(Number(input.heroCropX), 0, 100),
      clamp(Number(input.heroCropY), 0, 100),
      clamp(Number(input.heroCropZoom), 1, 3),
      JSON.stringify({
        title: input.heroTitle.trim() || DEFAULT_HOME_SETTINGS.heroTitle,
        subtitle: input.heroSubtitle.trim() || DEFAULT_HOME_SETTINGS.heroSubtitle,
        buttonText: input.heroButtonText.trim() || DEFAULT_HOME_SETTINGS.heroButtonText,
        buttonHref: normalizeHomeHref(input.heroButtonHref),
        imageUrl: input.heroImageUrl.trim() || DEFAULT_HOME_SETTINGS.heroImageUrl,
        crop: {
          x: clamp(Number(input.heroCropX), 0, 100),
          y: clamp(Number(input.heroCropY), 0, 100),
          zoom: clamp(Number(input.heroCropZoom), 1, 3),
        },
      }),
    ]
  );
}
