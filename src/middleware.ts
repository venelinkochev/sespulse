import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  isAuthEnabled,
  verifySessionToken,
} from "./lib/session";

export async function middleware(req: NextRequest) {
  if (!isAuthEnabled()) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Always allow the login page itself.
  if (pathname === "/login") return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Skip Next internals, icons + web manifest (needed on the login page
  // itself, and fetched by browsers without cookies), and the public
  // health endpoint.
  matcher: [
    "/((?!_next/static|_next/image|favicon|icon\\.svg|icon-[a-z0-9-]+\\.png|apple-icon\\.png|manifest\\.webmanifest|api/health).*)",
  ],
};
