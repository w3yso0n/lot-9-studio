const CLOUDINARY_ORIGIN = "https://res.cloudinary.com";

function formatCsp(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([name, values]) => (values.length > 0 ? `${name} ${values.join(" ")}` : name))
    .join("; ");
}

/**
 * CSP estática (sin nonce por request) para permitir ISR y back/forward cache.
 * Next.js inyecta scripts inline de bootstrap en producción; sin nonce hace falta
 * 'unsafe-inline' (patrón oficial: https://nextjs.org/docs/app/guides/content-security-policy).
 * /theme-init.js sigue cubierto por 'self'.
 */
export function buildContentSecurityPolicy(isDev: boolean): string {
  const scriptSrc = ["'self'", "'unsafe-inline'"];
  if (isDev) {
    scriptSrc.push("'unsafe-eval'");
  }

  const styleSrc = ["'self'", "'unsafe-inline'"];

  const connectSrc = ["'self'"];
  if (isDev) {
    connectSrc.push("ws:", "wss:");
  }

  return formatCsp({
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    "style-src": styleSrc,
    "img-src": ["'self'", "blob:", "data:", CLOUDINARY_ORIGIN],
    "font-src": ["'self'"],
    "connect-src": connectSrc,
    "media-src": ["'self'", "blob:", "data:", CLOUDINARY_ORIGIN],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": [],
  });
}
