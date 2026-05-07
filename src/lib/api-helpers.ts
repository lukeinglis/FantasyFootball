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
 * Convert any error thrown from a Yahoo client call into a structured
 * NextResponse.
 *
 * - Configuration / "no tokens" errors → 401 with `notConfigured: true` so
 *   the UI shows a friendly "Yahoo API not connected" empty state.
 * - Anything else → 500 generic error.
 */
export function errorResponse(err: unknown, resource: string) {
  const message = err instanceof Error ? err.message : "Unknown error";
  const configError = isConfigError(err);

  if (configError) {
    return NextResponse.json(
      {
        error: "Yahoo API not connected",
        detail: message,
        notConfigured: true,
      },
      { status: 401 }
    );
  }

  console.error(`Error fetching ${resource}:`, err);
  return NextResponse.json(
    {
      error: `Failed to fetch ${resource}`,
      detail: message,
      notConfigured: false,
    },
    { status: 500 }
  );
}
