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

export type ProductImageDisplaySize =
  | "thumb"
  | "swatch"
  | "main"
  | "card"
  | "carousel"
  | "banner"
  | "hero";

const DISPLAY_TRANSFORMS: Record<ProductImageDisplaySize, string> = {
  thumb: "w_160,h_160,c_fill,q_auto:eco,f_auto",
  swatch: "w_128,h_128,c_pad,q_auto:eco,f_auto",
  main: "w_960,q_auto:good,f_auto",
  /** Grid de catálogo (~480px lógicos @2x). */
  card: "w_720,c_limit,q_auto:good,f_auto",
  /** Tiles del carrusel home (~340–380px lógicos @2x, ratio 4/5). */
  carousel: "w_760,h_950,c_fill,q_auto:good,f_auto",
  /** Banners 21/9 dentro de max-w-6xl. */
  banner: "w_1280,c_limit,q_auto:good,f_auto",
  /** Hero a ancho completo (hasta ~1920px lógicos). */
  hero: "w_1920,c_limit,q_auto:good,f_auto",
};

const CLOUDINARY_UPLOAD_RE =
  /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/i;

type ResponsiveProfile = {
  sizes: string;
  widths: number[];
  buildTransform: (width: number) => string;
};

const RESPONSIVE_PROFILES: Partial<Record<ProductImageDisplaySize, ResponsiveProfile>> = {
  carousel: {
    sizes: "(max-width: 640px) 76vw, (max-width: 1024px) 42vw, (max-width: 1280px) 28vw, 340px",
    widths: [320, 480, 640, 760],
    buildTransform: (w) =>
      `w_${w},h_${Math.round(w * 1.25)},c_fill,q_auto:good,f_auto`,
  },
  card: {
    sizes: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
    widths: [200, 360, 480, 720],
    buildTransform: (w) => `w_${w},c_limit,q_auto:good,f_auto`,
  },
  hero: {
    sizes: "100vw",
    widths: [480, 768, 1080, 1920],
    buildTransform: (w) => `w_${w},c_limit,q_auto:good,f_auto`,
  },
  banner: {
    sizes: "(max-width: 1152px) 100vw, 1152px",
    widths: [480, 768, 1152, 1280],
    buildTransform: (w) => `w_${w},c_limit,q_auto:good,f_auto`,
  },
  main: {
    sizes: "(max-width: 768px) 100vw, 960px",
    widths: [480, 720, 960],
    buildTransform: (w) => `w_${w},c_limit,q_auto:good,f_auto`,
  },
};

export type ResponsiveCloudinaryImage = {
  src: string;
  srcSet?: string;
  sizes?: string;
};

function cloudinaryTransformUrl(path: string, transform: string): string {
  const encoded = encodeProductImagePath(path);
  if (!encoded) return "";

  const match = encoded.match(CLOUDINARY_UPLOAD_RE);
  if (!match) return encoded;

  const [, prefix, rest] = match;
  if (/^(c_|w_|h_|q_|f_|g_|ar_|dpr_)/.test(rest)) {
    return encoded;
  }

  return `${prefix}${transform}/${rest}`;
}

export function getCloudinaryUrlAtWidth(
  path: string,
  size: ProductImageDisplaySize,
  width: number
): string {
  const profile = RESPONSIVE_PROFILES[size];
  if (!profile || !isCloudinaryPanelUrl(path)) {
    return getProductImageDisplayUrl(path, size);
  }
  return cloudinaryTransformUrl(path, profile.buildTransform(width));
}

/** URL lista para pintar (Cloudinary con tamaño fijo; rutas locales sin cambio). */
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

/** Imagen responsive con srcset para Cloudinary; rutas locales sin cambio. */
export function getResponsiveCloudinaryImage(
  path: string,
  size: ProductImageDisplaySize
): ResponsiveCloudinaryImage {
  const encoded = encodeProductImagePath(path);
  if (!encoded) return { src: "" };

  const profile = RESPONSIVE_PROFILES[size];
  if (!profile || !isCloudinaryPanelUrl(path)) {
    return { src: getProductImageDisplayUrl(path, size) || encoded };
  }

  const srcSet = profile.widths
    .map((w) => `${cloudinaryTransformUrl(path, profile.buildTransform(w))} ${w}w`)
    .join(", ");
  const defaultWidth = profile.widths[1] ?? profile.widths[0];

  return {
    src: cloudinaryTransformUrl(path, profile.buildTransform(defaultWidth)),
    srcSet,
    sizes: profile.sizes,
  };
}
