/** Tallas estándar del catálogo (orden de visualización). */
export const CATALOG_SIZE_ORDER = ["S", "M", "L", "XL"] as const;
export type CatalogSize = (typeof CATALOG_SIZE_ORDER)[number];

export function sortSizesSelected(selected: string[]): string[] {
  return CATALOG_SIZE_ORDER.filter((s) => selected.includes(s));
}
