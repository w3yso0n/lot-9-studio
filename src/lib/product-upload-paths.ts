/** Rutas de subida del panel (sin dependencias de Node; seguro importar en cliente). */
export const PRODUCT_UPLOAD_WEB_PREFIX = "/uploads/products";

/** Subidas en disco local (desarrollo / servidor con `public/` escribible). */
export function isLocalPanelUploadPath(webPath: string): boolean {
  const p = webPath.trim();
  return /^\/uploads\/products\/[0-9a-f-]{36}\.(jpe?g|png|webp|gif)$/i.test(p);
}

/** URL pública de Cloudinary. */
export function isCloudinaryPanelUrl(webPath: string): boolean {
  const p = webPath.trim();
  return /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/.+/i.test(p);
}

/** Petición de imagen sin cookies ni referrer hacia Cloudinary. */
export function cloudinaryImageAttributes(src: string): {
  crossOrigin?: "anonymous";
  referrerPolicy?: "no-referrer";
} {
  if (!isCloudinaryPanelUrl(src)) return {};
  return { crossOrigin: "anonymous", referrerPolicy: "no-referrer" };
}

/** Subida propia del panel: se puede borrar al quitar imagen o producto. */
export function isOwnedUploadPath(webPath: string): boolean {
  return isLocalPanelUploadPath(webPath) || isCloudinaryPanelUrl(webPath);
}
