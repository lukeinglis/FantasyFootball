import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";
import logger from "@/lib/logger";

/**
 * GET /api/auth/signout
 * Clears the session cookie and redirects to the home page.
 */
export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id");
  const log = requestId ? logger.child({ requestId }) : logger;
  log.info({ route: "/api/auth/signout" }, "sign-out initiated");
  const baseUrl = request.nextUrl.origin;
  const response = NextResponse.redirect(`${baseUrl}/`);
  response.headers.set("Set-Cookie", clearSessionCookie());
  log.info({ route: "/api/auth/signout" }, "session cleared, redirecting");
  return response;
}
