import { cache } from "@/lib/cache";
import logger from "@/lib/logger";
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

// This request used to omit `scope` entirely, because omitting it meant "grant
// everything this app is registered for" and the app is registered for Fantasy
// Sports. Yahoo changed that default to grant nothing, so tokens kept being
// issued and kept being refused, which surfaced as a 403 reading "This
// application is not authorized to perform this action" on every endpoint.
//
// Only ask for what the app is actually entitled to. Yahoo rejects the whole
// request with invalid_scope if any single scope is not registered, so adding
// email or profile here would break authorization outright rather than
// degrading. Confirmed against the consent endpoint: openid and fspt-r are
// accepted, email, profile, fspt-w and sdct-r are not.
export const DEFAULT_SCOPE = "openid fspt-r";

/**
 * Build the Yahoo OAuth consent URL.
 * Redirect the user here to authorize the app.
 *
 * Pass a scope to override the default. Passing an empty string omits the
 * parameter entirely, which reproduces the pre-fspt-r behaviour and is the
 * escape hatch if Yahoo rejects the scope outright and blocks sign-in.
 */
export function getAuthUrl(scope: string = DEFAULT_SCOPE): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    language: "en-us",
  });
  if (scope) params.set("scope", scope);
  return `${YAHOO_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for access + refresh tokens.
 * Called once after the user approves OAuth.
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<YahooTokens> {
  logger.info({ module: "yahoo/auth" }, "exchangeCodeForTokens called");
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
    logger.error({ module: "yahoo/auth", status: response.status }, "token exchange failed");
    throw new Error(
      `Yahoo token exchange failed (${response.status}): ${body}`
    );
  }

  const data = await response.json();
  const tokens = parseTokenResponse(data);
  await storeTokens(tokens);
  logger.info({ module: "yahoo/auth" }, "token exchange succeeded");
  return tokens;
}

/**
 * Get a valid access token, refreshing if needed.
 * This is the main entry point for API calls.
 */
export async function getValidToken(): Promise<string> {
  logger.debug({ module: "yahoo/auth" }, "getValidToken called");
  const tokens = await getStoredTokens();

  if (!tokens) {
    logger.warn({ module: "yahoo/auth" }, "no stored tokens found");
    throw new Error(
      "No Yahoo tokens found. Visit /api/auth/yahoo to authorize."
    );
  }

  // Describe what came out of the cache without printing any of it. A stored
  // record can be present but malformed — no expiresAt makes the comparison
  // below NaN, which is always false, so a token with no expiry would never
  // refresh and every API call would go out with `Bearer undefined`.
  logger.info(
    {
      module: "yahoo/auth",
      hasAccessToken: typeof tokens.accessToken === "string" && tokens.accessToken.length > 0,
      hasRefreshToken: typeof tokens.refreshToken === "string" && tokens.refreshToken.length > 0,
      expiresAt: Number.isFinite(tokens.expiresAt)
        ? new Date(tokens.expiresAt).toISOString()
        : String(tokens.expiresAt),
    },
    "stored token loaded"
  );

  const bufferMs = 5 * 60 * 1000;
  // `!(x < y)` rather than `x >= y` so a missing or unparseable expiry refreshes
  // instead of silently passing a dead token through.
  if (!(Date.now() + bufferMs < tokens.expiresAt)) {
    logger.info({ module: "yahoo/auth" }, "token expiring soon, refreshing");
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
  logger.info({ module: "yahoo/auth" }, "refreshAccessToken called");
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
    logger.error({ module: "yahoo/auth", status: response.status }, "token refresh failed");
    throw new Error(
      `Yahoo token refresh failed (${response.status}): ${body}`
    );
  }

  const data = await response.json();
  const tokens = parseTokenResponse(data);
  await storeTokens(tokens);
  logger.info({ module: "yahoo/auth" }, "token refresh succeeded");
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
