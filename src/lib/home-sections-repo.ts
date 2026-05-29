import { getPool } from "@/lib/db";
import { ensureHomeSchema } from "@/lib/home-schema";
import type { HomeSection, HomeSectionType } from "@/lib/home-sections";
import { unstable_cache } from "next/cache";
import type { QueryResultRow } from "pg";

type HomeSectionRow = QueryResultRow & {
  id: number;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: unknown;
  sort_order: number;
  is_enabled: boolean;
};

const SECTION_TYPES = new Set<HomeSectionType>([
  "hero",
  "banner",
  "carousel",
  "video",
  "new_drops",
  "catalog",
  "text",
]);

function rowToHomeSection(row: HomeSectionRow): HomeSection | null {
  if (!SECTION_TYPES.has(row.type as HomeSectionType)) return null;
  return {
    id: row.id,
    type: row.type as HomeSectionType,
    title: row.title ?? "",
    subtitle: row.subtitle ?? "",
    content:
      row.content && typeof row.content === "object"
        ? (row.content as Record<string, unknown>)
        : {},
    sortOrder: row.sort_order,
    isEnabled: row.is_enabled,
  };
}

async function fetchHomeSections(): Promise<HomeSection[]> {
  await ensureHomeSchema();
  const pool = getPool();
  const { rows } = await pool.query<HomeSectionRow>(
    `SELECT id, type, title, subtitle, content, sort_order, is_enabled
     FROM home_sections
     WHERE is_enabled = true
     ORDER BY sort_order ASC, id ASC`
  );
  return rows.map(rowToHomeSection).filter((row): row is HomeSection => row != null);
}

export async function getHomeSectionsForAdmin(): Promise<HomeSection[]> {
  await ensureHomeSchema();
  const pool = getPool();
  const { rows } = await pool.query<HomeSectionRow>(
    `SELECT id, type, title, subtitle, content, sort_order, is_enabled
     FROM home_sections
     ORDER BY sort_order ASC, id ASC`
  );
  return rows.map(rowToHomeSection).filter((row): row is HomeSection => row != null);
}

export const getHomeSections = unstable_cache(
  fetchHomeSections,
  ["home-sections"],
  { revalidate: 60, tags: ["home-sections"] }
);

async function fetchHomeBuilderConfigured(): Promise<boolean> {
  await ensureHomeSchema();
  const pool = getPool();
  const { rows } = await pool.query<{ configured: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM home_sections) AS configured`
  );
  return Boolean(rows[0]?.configured);
}

/** True si el admin ya guardó bloques en el constructor (aunque estén desactivados). */
export const isHomeBuilderConfigured = unstable_cache(
  fetchHomeBuilderConfigured,
  ["home-builder-configured"],
  { revalidate: 60, tags: ["home-sections"] }
);
