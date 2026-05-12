import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/yahoo/auth";
import { createSessionCookie } from "@/lib/session";

/**
 * GET /api/auth/callback?code=...
 * Handles the OAuth callback from Yahoo.
 * Exchanges the authorization code for tokens, fetches the user profile,
 * sets a session cookie, and redirects home.
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
    const tokens = await exchangeCodeForTokens(code);

    // Fetch Yahoo user profile to get their display name
    let displayName = "Manager";
    let avatarUrl: string | undefined;
    try {
      const profileResp = await fetch(
        "https://api.login.yahoo.com/openid/v1/userinfo",
        {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        }
      );
      if (profileResp.ok) {
        const profile = await profileResp.json();
        displayName =
          profile.nickname ||
          profile.name ||
          profile.given_name ||
          "Manager";
        if (profile.picture) {
          avatarUrl = profile.picture;
        }
      }
    } catch (err) {
      console.warn("Could not fetch Yahoo profile, using default name:", err);
    }

    // Set session cookie and redirect home
    const baseUrl = request.nextUrl.origin;
    const response = NextResponse.redirect(`${baseUrl}/?auth=success`);
    response.headers.set(
      "Set-Cookie",
      createSessionCookie({ name: displayName, avatarUrl })
    );

    return response;
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
