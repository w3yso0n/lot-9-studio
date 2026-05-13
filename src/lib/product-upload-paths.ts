/** Rutas de subida del panel (sin dependencias de Node; seguro importar en cliente). */
export const PRODUCT_UPLOAD_WEB_PREFIX = "/uploads/products";

/** Rutas generadas por el panel: UUID + extensión permitida. */
export function isOwnedUploadPath(webPath: string): boolean {
  const p = webPath.trim();
  return /^\/uploads\/products\/[0-9a-f-]{36}\.(jpe?g|png|webp|gif)$/i.test(p);
}
