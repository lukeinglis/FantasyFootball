import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/yahoo/auth";

/**
 * GET /api/auth/callback?code=...
 * Handles the OAuth callback from Yahoo.
 * Exchanges the authorization code for tokens and stores them.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 }
    );
  }

  try {
    await exchangeCodeForTokens(code);

    // Redirect to home with a success indicator
    const baseUrl = request.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/?auth=success`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json(
      {
        error: "Failed to exchange authorization code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
