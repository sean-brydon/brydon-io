import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware — lightweight proxy layer only.
 *
 * Auth protection is NOT handled here. It's done server-side in:
 * - Dashboard layout: auth.api.getSession() → redirect if no session
 * - Hono API middleware: auth.api.getSession() → 401 if no session
 *
 * This middleware is reserved for:
 * - Custom domain → username rewrites (V2)
 * - Rate limiting headers (V3)
 * - Geo/locale detection
 */
export function middleware(request: NextRequest) {
  // ── Future: Custom domain rewriting ─────────────────────────────────
  // const hostname = request.headers.get("host") || "";
  // if (hostname !== "devl.dev" && !hostname.includes("localhost")) {
  //   // Look up username for custom domain, rewrite to /[username]/*
  // }

  return NextResponse.next();
}

export const config = {
  // Only run on paths that need proxying — skip static assets and API
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/).*)",
  ],
};
