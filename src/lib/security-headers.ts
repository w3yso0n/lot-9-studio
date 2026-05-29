/** Headers de aislamiento cross-origin (COOP, etc.). */
export const SECURITY_RESPONSE_HEADERS: Record<string, string> = {
  "Cross-Origin-Opener-Policy": "same-origin",
};

export function applySecurityResponseHeaders(response: Headers): void {
  for (const [name, value] of Object.entries(SECURITY_RESPONSE_HEADERS)) {
    response.set(name, value);
  }
}
