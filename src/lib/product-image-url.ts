import {
  isCloudinaryPanelUrl,
  isLocalPanelUploadPath,
} from "@/lib/product-upload-paths";

/** Codifica segmentos de rutas locales (`/uploads/...`) para next/image y el navegador. */
export function encodeProductImagePath(path: string): string {
  const t = path.trim();
  if (!t) return "";
  if (/^(https?:|blob:|data:)/i.test(t)) return t;
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

export type ProductImageDisplaySize = "thumb" | "swatch" | "main";

const DISPLAY_TRANSFORMS: Record<ProductImageDisplaySize, string> = {
  thumb: "w_160,h_160,c_fill,q_auto:eco,f_auto",
  swatch: "w_128,h_128,c_pad,q_auto:eco,f_auto",
  main: "w_960,q_auto:good,f_auto",
};

const CLOUDINARY_UPLOAD_RE =
  /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/i;

/** URL lista para pintar (Cloudinary con tamaño; rutas locales sin cambio). */
export function getProductImageDisplayUrl(
  path: string,
  size: ProductImageDisplaySize
): string {
  const encoded = encodeProductImagePath(path);
  if (!encoded) return "";

  const match = encoded.match(CLOUDINARY_UPLOAD_RE);
  if (!match) return encoded;

  const [, prefix, rest] = match;
  if (/^(c_|w_|h_|q_|f_|g_|ar_|dpr_)/.test(rest)) {
    return encoded;
  }

  return `${prefix}${DISPLAY_TRANSFORMS[size]}/${rest}`;
}
