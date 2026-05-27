import { getPool } from "@/lib/db";
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

export async function upsertHomeSettings(
  input: HomeSettingsMutationInput
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO home_settings (
       id,
       hero_title,
       hero_subtitle,
       hero_button_text,
       hero_button_href,
       hero_image_url,
       featured_video_url,
       is_hero_enabled,
       is_video_enabled,
       updated_at
     )
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, now())
     ON CONFLICT (id)
     DO UPDATE SET
       hero_title = EXCLUDED.hero_title,
       hero_subtitle = EXCLUDED.hero_subtitle,
       hero_button_text = EXCLUDED.hero_button_text,
       hero_button_href = EXCLUDED.hero_button_href,
       hero_image_url = EXCLUDED.hero_image_url,
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
      input.featuredVideoUrl.trim() || DEFAULT_HOME_SETTINGS.featuredVideoUrl,
      input.isHeroEnabled,
      input.isVideoEnabled,
    ]
  );
}
