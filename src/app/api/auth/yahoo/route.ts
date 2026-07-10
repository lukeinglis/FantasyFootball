import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/yahoo/auth";
import logger from "@/lib/logger";

/**
 * GET /api/auth/yahoo
 * Redirects to Yahoo's OAuth consent screen.
 * One-time setup — visit this URL to authorize the app.
 */
export async function GET() {
  logger.info({ route: "/api/auth/yahoo" }, "OAuth flow initiated");
  const url = getAuthUrl();
  logger.info({ route: "/api/auth/yahoo", redirectHost: new URL(url).host }, "redirecting to Yahoo OAuth");
  return NextResponse.redirect(url);
}
