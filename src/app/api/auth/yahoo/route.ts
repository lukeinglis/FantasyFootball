import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl, DEFAULT_SCOPE } from "@/lib/yahoo/auth";
import logger from "@/lib/logger";

/**
 * GET /api/auth/yahoo
 * Redirects to Yahoo's OAuth consent screen.
 * One-time setup — visit this URL to authorize the app.
 *
 * `?scope=` overrides what is requested. `?scope=basic` drops the fantasy
 * scope and asks only for identity, which is worth having as a way back in if
 * Yahoo ever refuses the fantasy scope and leaves sign-in unusable.
 */
export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("scope");
  const scope =
    requested === "basic" ? "" : requested ? requested : DEFAULT_SCOPE;

  logger.info({ route: "/api/auth/yahoo", scope: scope || "(none)" }, "OAuth flow initiated");
  const url = getAuthUrl(scope);
  logger.info(
    { route: "/api/auth/yahoo", redirectHost: new URL(url).host },
    "redirecting to Yahoo OAuth"
  );
  return NextResponse.redirect(url);
}
