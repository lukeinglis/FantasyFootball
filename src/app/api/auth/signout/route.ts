import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

/**
 * GET /api/auth/signout
 * Clears the session cookie and redirects to the home page.
 */
export async function GET(request: NextRequest) {
  const baseUrl = request.nextUrl.origin;
  const response = NextResponse.redirect(`${baseUrl}/`);
  response.headers.set("Set-Cookie", clearSessionCookie());
  return response;
}
