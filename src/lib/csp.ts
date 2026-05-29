const CLOUDINARY_ORIGIN = "https://res.cloudinary.com";

function formatCsp(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([name, values]) => (values.length > 0 ? `${name} ${values.join(" ")}` : name))
    .join("; ");
}

/** CSP en modo enforcement (no Report-Only). */
export function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  if (isDev) {
    scriptSrc.push("'unsafe-eval'");
  }

  const styleSrc = ["'self'", `'nonce-${nonce}'`];
  // inlineCss (experimental) puede emitir estilos sin nonce en algunos builds.
  if (process.env.NODE_ENV === "production") {
    styleSrc.push("'unsafe-inline'");
  }

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

export const CSP_NONCE_HEADER = "x-nonce";
