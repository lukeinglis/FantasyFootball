import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/yahoo/auth";

/**
 * GET /api/auth/yahoo
 * Redirects to Yahoo's OAuth consent screen.
 * One-time setup — visit this URL to authorize the app.
 */
export async function GET() {
  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
