import { buildContentSecurityPolicy } from "@/lib/csp";
import { applySecurityResponseHeaders } from "@/lib/security-headers";
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const csp = buildContentSecurityPolicy(isDev);

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", csp);
  applySecurityResponseHeaders(response.headers);

  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|woff2?|js)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
