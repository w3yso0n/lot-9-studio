import { getPool } from "@/lib/db";
import { ensureHomeSchema } from "@/lib/home-schema";
import { getHomeSectionsForAdmin } from "@/lib/home-sections-repo";
import type { HomeSection, HomeSectionType } from "@/lib/home-sections";

const SECTION_TYPES = new Set<HomeSectionType>([
  "hero",
  "banner",
  "carousel",
  "video",
  "new_drops",
  "catalog",
  "text",
]);

export type HomeSectionInput = Omit<HomeSection, "id"> & {
  id?: number;
};

function sanitizeContent(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function syncHeroToSettings(heroSection: HomeSectionInput): Promise<void> {
  const pool = getPool();
  const cropData = heroSection.content.crop as Record<string, unknown> | undefined;
  const heroTitle = stringValue(heroSection.content.title) || stringValue(heroSection.title);
  const heroSubtitle = stringValue(heroSection.content.subtitle) || stringValue(heroSection.subtitle);
  const heroButtonText = stringValue(heroSection.content.buttonText);
  const heroButtonHref = stringValue(heroSection.content.buttonHref);
  const heroImageUrl = stringValue(heroSection.content.imageUrl);
  const heroCropX = typeof cropData?.x === "number" ? cropData.x : 50;
  const heroCropY = typeof cropData?.y === "number" ? cropData.y : 50;
  const heroCropZoom = typeof cropData?.zoom === "number" ? cropData.zoom : 1;

  // Solo actualizar los campos de home_settings si el hero tiene datos
  if (heroImageUrl || heroTitle || heroButtonText) {
    await pool.query(
      `UPDATE home_settings SET
        hero_title = COALESCE(NULLIF($1, ''), hero_title),
        hero_subtitle = COALESCE(NULLIF($2, ''), hero_subtitle),
        hero_button_text = COALESCE(NULLIF($3, ''), hero_button_text),
        hero_button_href = COALESCE(NULLIF($4, ''), hero_button_href),
        hero_image_url = COALESCE(NULLIF($5, ''), hero_image_url),
        hero_crop_x = $6,
        hero_crop_y = $7,
        hero_crop_zoom = $8,
        updated_at = now()
       WHERE id = 1`,
      [heroTitle, heroSubtitle, heroButtonText, heroButtonHref, heroImageUrl, heroCropX, heroCropY, heroCropZoom]
    );
  }
}

export async function replaceHomeSections(
  sections: HomeSectionInput[]
): Promise<HomeSection[]> {
  await ensureHomeSchema();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const keptIds = sections
      .map((section) => section.id)
      .filter(
        (id): id is number =>
          typeof id === "number" && Number.isInteger(id) && id > 0
      );

    if (keptIds.length > 0) {
      await client.query(`DELETE FROM home_sections WHERE NOT (id = ANY($1::int[]))`, [
        keptIds,
      ]);
    } else if (sections.length > 0) {
      await client.query(`DELETE FROM home_sections`);
    } else {
      await client.query(`DELETE FROM home_sections`);
      await client.query("COMMIT");
      return [];
    }

    let sortOrder = 0;
    for (const section of sections) {
      if (!SECTION_TYPES.has(section.type)) continue;

      if (section.type === "hero") {
        await syncHeroToSettings(section);
      }

      const sectionId = section.id;
      const id =
        typeof sectionId === "number" && Number.isInteger(sectionId) && sectionId > 0
          ? sectionId
          : null;
      if (id) {
        await client.query(
          `UPDATE home_sections
           SET type = $1,
               title = $2,
               subtitle = $3,
               content = $4::jsonb,
               sort_order = $5,
               is_enabled = $6,
               updated_at = now()
           WHERE id = $7`,
          [
            section.type,
            section.title.trim() || null,
            section.subtitle.trim() || null,
            JSON.stringify(sanitizeContent(section.content)),
            sortOrder,
            section.isEnabled,
            id,
          ]
        );
      } else {
        await client.query(
          `INSERT INTO home_sections
             (type, title, subtitle, content, sort_order, is_enabled)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6)`,
          [
            section.type,
            section.title.trim() || null,
            section.subtitle.trim() || null,
            JSON.stringify(sanitizeContent(section.content)),
            sortOrder,
            section.isEnabled,
          ]
        );
      }
      sortOrder += 1;
    }

    await client.query("COMMIT");
    return getHomeSectionsForAdmin();
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
