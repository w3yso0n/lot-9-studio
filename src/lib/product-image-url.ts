import {
  isCloudinaryPanelUrl,
  isLocalPanelUploadPath,
} from "@/lib/product-upload-paths";

/** Codifica segmentos de rutas locales (`/uploads/...`) para next/image y el navegador. */
export function encodeProductImagePath(path: string): string {
  const t = path.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  const parts = t.split("/").filter(Boolean);
  if (parts.length === 0) return t;
  return "/" + parts.map(encodeURIComponent).join("/");
}

export function isValidProductImagePath(path: string): boolean {
  const t = path.trim();
  return t.length > 0;
}

/** Rutas del panel y Cloudinary: evitar el optimizador de Next (falla en móvil con URLs locales). */
export function shouldUnoptimizeProductImage(path: string): boolean {
  const t = path.trim();
  if (!t) return true;
  return isLocalPanelUploadPath(t) || isCloudinaryPanelUrl(t);
}

export function sanitizeProductImagePaths(paths: string[]): string[] {
  return paths.map((p) => p.trim()).filter(isValidProductImagePath);
}
