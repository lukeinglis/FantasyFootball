import { cache } from "@/lib/cache";
import type { YahooTokens } from "./types";

// ============================================================
// Yahoo OAuth 2.0 — Token Management
// ============================================================

const YAHOO_AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";
const YAHOO_TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";

const TOKEN_CACHE_KEY = "yahoo:tokens";
// Store tokens with a very long TTL — refresh tokens last months
const TOKEN_CACHE_TTL = 365 * 24 * 60 * 60; // 1 year

function getClientId(): string {
  const id = process.env.YAHOO_CLIENT_ID;
  if (!id) throw new Error("YAHOO_CLIENT_ID is not set");
  // Yahoo displays Client IDs with a trailing "&" (OAuth 1.0 artifact). Strip it.
  return id.replace(/&$/, "");
}

function getClientSecret(): string {
  const secret = process.env.YAHOO_CLIENT_SECRET;
  if (!secret) throw new Error("YAHOO_CLIENT_SECRET is not set");
  return secret;
}

function getRedirectUri(): string {
  return (
    process.env.YAHOO_REDIRECT_URI || "http://localhost:3000/api/auth/callback"
  );
}

/**
 * Build the Yahoo OAuth consent URL.
 * Redirect the user here to authorize the app.
 */
export function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    language: "en-us",
  });
  return `${YAHOO_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for access + refresh tokens.
 * Called once after the user approves OAuth.
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<YahooTokens> {
  const basicAuth = Buffer.from(
    `${getClientId()}:${getClientSecret()}`
  ).toString("base64");

  const response = await fetch(YAHOO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Yahoo token exchange failed (${response.status}): ${body}`
    );
  }

  const data = await response.json();
  const tokens = parseTokenResponse(data);
  await storeTokens(tokens);
  return tokens;
}

/**
 * Get a valid access token, refreshing if needed.
 * This is the main entry point for API calls.
 */
export async function getValidToken(): Promise<string> {
  const tokens = await getStoredTokens();

  if (!tokens) {
    throw new Error(
      "No Yahoo tokens found. Visit /api/auth/yahoo to authorize."
    );
  }

  // If token expires in less than 5 minutes, refresh it
  const bufferMs = 5 * 60 * 1000;
  if (Date.now() + bufferMs >= tokens.expiresAt) {
    const refreshed = await refreshAccessToken(tokens.refreshToken);
    return refreshed.accessToken;
  }

  return tokens.accessToken;
}

/**
 * Refresh the access token using the refresh token.
 */
async function refreshAccessToken(
  refreshToken: string
): Promise<YahooTokens> {
  const basicAuth = Buffer.from(
    `${getClientId()}:${getClientSecret()}`
  ).toString("base64");

  const response = await fetch(YAHOO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Yahoo token refresh failed (${response.status}): ${body}`
    );
  }

  const data = await response.json();
  const tokens = parseTokenResponse(data);
  await storeTokens(tokens);
  return tokens;
}

// --- Token Storage (via cache layer) ---

async function storeTokens(tokens: YahooTokens): Promise<void> {
  await cache.set(TOKEN_CACHE_KEY, tokens, TOKEN_CACHE_TTL);
}

async function getStoredTokens(): Promise<YahooTokens | null> {
  return cache.get<YahooTokens>(TOKEN_CACHE_KEY);
}

// --- Helpers ---

function parseTokenResponse(data: Record<string, unknown>): YahooTokens {
  const expiresIn = (data.expires_in as number) || 3600;

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    tokenType: (data.token_type as string) || "bearer",
    expiresAt: Date.now() + expiresIn * 1000,
  };
}
