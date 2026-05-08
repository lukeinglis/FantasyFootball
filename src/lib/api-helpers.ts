import { NextResponse } from "next/server";

/**
 * Best-effort detection that the underlying error is a Yahoo OAuth setup
 * issue (no tokens, missing client id/secret, etc.) rather than a transient
 * network/API failure.
 */
function isConfigError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : "";
  const lower = msg.toLowerCase();
  return (
    lower.includes("yahoo_client_id") ||
    lower.includes("yahoo_client_secret") ||
    lower.includes("no yahoo tokens") ||
    lower.includes("authorize") ||
    lower.includes("not configured")
  );
}

/**
 * Detect whether the error indicates the Yahoo API is reachable but the
 * season/league data is unavailable. This typically happens in the offseason
 * when Yahoo returns 400 errors because no active season exists.
 */
function isOffseasonError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : "";
  const lower = msg.toLowerCase();

  // Yahoo returns 400 when there is no active season for the game key
  if (lower.includes("(400)")) return true;

  // "Invalid" league/game key errors from Yahoo
  if (
    lower.includes("invalid league") ||
    lower.includes("invalid game") ||
    lower.includes("game key") ||
    lower.includes("league key")
  ) {
    return true;
  }

  // Failed to resolve the NFL game key (no current season)
  if (lower.includes("failed to resolve nfl game key")) return true;

  return false;
}

/**
 * Convert any error thrown from a Yahoo client call into a structured
 * NextResponse.
 *
 * - Configuration / "no tokens" errors → 401 with `notConfigured: true`
 * - Offseason / no active season errors → 503 with `offseason: true`
 * - Anything else → 500 generic error
 */
export function errorResponse(err: unknown, resource: string) {
  const message = err instanceof Error ? err.message : "Unknown error";

  if (isConfigError(err)) {
    return NextResponse.json(
      {
        error: "Yahoo API not connected",
        detail: message,
        notConfigured: true,
        offseason: false,
      },
      { status: 401 }
    );
  }

  if (isOffseasonError(err)) {
    return NextResponse.json(
      {
        error: `No active season data for ${resource}`,
        detail: message,
        notConfigured: false,
        offseason: true,
      },
      { status: 503 }
    );
  }

  console.error(`Error fetching ${resource}:`, err);
  return NextResponse.json(
    {
      error: `Failed to fetch ${resource}`,
      detail: message,
      notConfigured: false,
      offseason: false,
    },
    { status: 500 }
  );
}
