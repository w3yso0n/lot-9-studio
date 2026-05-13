/**
 * Etiquetas de filtro (`product_color_filters`) usadas en el catálogo legado.
 * Extraídas de `scripts/legacy-data.ts`: solo aparecen estas combinaciones.
 */
export const CATALOG_COLOR_FILTER_OPTIONS = ["Black", "White", "Red", "Blue"] as const;
export type CatalogColorFilter = (typeof CATALOG_COLOR_FILTER_OPTIONS)[number];

/** Orden fijo al guardar (coincide con el listado del admin). */
export function sortColorFiltersSelected(selected: string[]): string[] {
  return CATALOG_COLOR_FILTER_OPTIONS.filter((c) => selected.includes(c));
}

/** Etiqueta en español para la UI (en BD se guarda el valor en inglés). */
export const COLOR_FILTER_LABELS: Record<CatalogColorFilter, string> = {
  Black: "Negro",
  White: "Blanco",
  Red: "Rojo",
  Blue: "Azul",
};
