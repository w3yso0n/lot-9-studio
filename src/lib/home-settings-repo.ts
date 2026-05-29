import { DEFAULT_HOME_SETTINGS, type HomeSettings } from "@/lib/home-settings";
import { getPool } from "@/lib/db";
import { ensureHomeSchema } from "@/lib/home-schema";
import { unstable_cache } from "next/cache";
import type { QueryResultRow } from "pg";

type HomeSettingsRow = QueryResultRow & {
  hero_title: string;
  hero_subtitle: string;
  hero_button_text: string;
  hero_button_href: string;
  hero_image_url: string | null;
  hero_crop_x: string | number | null;
  hero_crop_y: string | number | null;
  hero_crop_zoom: string | number | null;
  featured_video_url: string | null;
  is_hero_enabled: boolean;
  is_video_enabled: boolean;
  updated_at: Date | string;
};

function numberOrDefault(value: unknown, fallback: number): number {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function rowToHomeSettings(row: HomeSettingsRow | undefined): HomeSettings {
  if (!row) return DEFAULT_HOME_SETTINGS;
  return {
    heroTitle: row.hero_title || DEFAULT_HOME_SETTINGS.heroTitle,
    heroSubtitle: row.hero_subtitle || DEFAULT_HOME_SETTINGS.heroSubtitle,
    heroButtonText: row.hero_button_text || DEFAULT_HOME_SETTINGS.heroButtonText,
    heroButtonHref: row.hero_button_href || DEFAULT_HOME_SETTINGS.heroButtonHref,
    heroImageUrl: row.hero_image_url || DEFAULT_HOME_SETTINGS.heroImageUrl,
    heroCropX: numberOrDefault(row.hero_crop_x, DEFAULT_HOME_SETTINGS.heroCropX),
    heroCropY: numberOrDefault(row.hero_crop_y, DEFAULT_HOME_SETTINGS.heroCropY),
    heroCropZoom: numberOrDefault(
      row.hero_crop_zoom,
      DEFAULT_HOME_SETTINGS.heroCropZoom
    ),
    featuredVideoUrl: row.featured_video_url || DEFAULT_HOME_SETTINGS.featuredVideoUrl,
    isHeroEnabled: row.is_hero_enabled,
    isVideoEnabled: row.is_video_enabled,
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at),
  };
}

async function fetchHomeSettings(): Promise<HomeSettings> {
  await ensureHomeSchema();
  const pool = getPool();
  const { rows } = await pool.query<HomeSettingsRow>(
    `SELECT
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
     FROM home_settings
     WHERE id = 1`
  );
  return rowToHomeSettings(rows[0]);
}

export const getHomeSettings = unstable_cache(
  fetchHomeSettings,
  ["home-settings"],
  { revalidate: 60, tags: ["home-settings"] }
);

export async function getHomeSettingsForAdmin(): Promise<HomeSettings> {
  return fetchHomeSettings();
}
