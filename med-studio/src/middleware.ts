import { NextRequest, NextResponse } from "next/server";

// This middleware only does a cheap "is there a session cookie at all" gate
// for page routes, to bounce obviously-logged-out visitors early. It is NOT
// the source of truth for authorization — every protected API route and
// server component re-validates the session against the database via
// src/lib/auth.ts (requireAuth / requireOwner), because:
//   1. The Prisma client can't run in the default edge middleware runtime.
//   2. Owner checks must be re-derived from OWNER_DISCORD_IDS server-side,
//      never inferred from a cookie's mere presence.
const PUBLIC_PATHS = ["/login", "/api/auth/discord"]; // covers /api/auth/discord and /api/auth/discord/callback

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const hasSession = req.cookies.has("med_studio_session");
  if (!hasSession && pathname !== "/login") {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Exclude Next internals, favicon, AND any request for a static file
  // under /public (images, fonts, etc.) — without this, an unauthenticated
  // request for e.g. /logo.png itself gets redirected to /login instead of
  // returning the image, breaking the logo on the login page itself.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$).*)"],
};
