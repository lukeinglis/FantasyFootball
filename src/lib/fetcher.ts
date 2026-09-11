// ============================================================
// Server-side fetcher for our own /api/yahoo/* routes.
// Used by server components. Returns null on any failure so
// pages can render a graceful "not connected" state.
// ============================================================

import { headers } from "next/headers";
import logger from "./logger";

/**
 * Build an absolute base URL for server-side fetches to our own API.
 * Works both locally and on Vercel (preview, prod).
 */
async function getBaseUrl(): Promise<string> {
  // Allow explicit override via env (useful for self-hosting).
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");

  // On Vercel, VERCEL_URL is set to the deployment URL.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    const proto = h.get("x-forwarded-proto") || "http";
    if (host) return `${proto}://${host}`;
  } catch {
    // headers() throws if called outside a request context; fall through
  }

  return "http://localhost:3000";
}

export type FetchResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      message: string;
      /** True when the API returned a config-related error (Yahoo not connected). */
      notConfigured: boolean;
      /**
       * True when Yahoo accepted the request, identified us, and refused.
       * Distinct from `notConfigured`, which means we never got that far, and
       * from `offseason`, which means the API answered and had nothing to say.
       * Nothing the reader does will fix this one.
       */
      accessDenied: boolean;
      /** True when the API is connected but no active season data exists (offseason). */
      offseason: boolean;
    };

/**
 * Yahoo refusing an authenticated request.
 *
 * This used to be folded into the offseason branch, so a revoked API grant
 * rendered as "Countdown to Kickoff" and the site cheerfully told readers the
 * season had not started while it was underway. Worth keeping separate: the
 * offseason ends on its own, and this does not.
 */
function looksLikeAccessDenied(status: number, message: string): boolean {
  const lower = (message || "").toLowerCase();
  return (
    status === 403 ||
    lower.includes("not authorized to perform this action") ||
    lower.includes("additional_authorization_required") ||
    lower.includes("invalid_scope") ||
    lower.includes("token_rejected") ||
    lower.includes(": 403") ||
    lower.includes("(403)")
  );
}

/**
 * Best-effort detection that the API is reporting a config issue.
 *
 * A 403 is deliberately not treated as one. "Not configured" tells the reader
 * the commissioner needs to connect Yahoo, which is actionable and, when Yahoo
 * has revoked the grant, false.
 */
function looksLikeConfigError(status: number, message: string): boolean {
  if (looksLikeAccessDenied(status, message)) return false;
  if (status === 401) return true;
  const lower = (message || "").toLowerCase();
  return (
    lower.includes("yahoo_client_id") ||
    lower.includes("yahoo_client_secret") ||
    lower.includes("no yahoo tokens") ||
    lower.includes("authorize") ||
    lower.includes("not configured")
  );
}

/**
 * Detect offseason/no-active-season errors from structured API responses.
 *
 * Only ever true when Yahoo has not refused us. A failure to resolve the game
 * key reads as "no season yet" on its own, but reads as "we are locked out"
 * when it arrives with a 403 attached, and the second reading wins.
 */
function looksLikeOffseasonError(status: number, body: Record<string, unknown> | null, message: string): boolean {
  const bodyText = String(body?.error ?? body?.detail ?? "").toLowerCase();
  const msgLower = (message || "").toLowerCase();
  const combined = `${bodyText} ${msgLower}`;
  if (looksLikeAccessDenied(status, combined)) return false;
  if (body?.offseason === true) return true;
  return (
    combined.includes("no active season") ||
    combined.includes("temporary problem") ||
    combined.includes("failed to resolve nfl game key") ||
    (status >= 400 && combined.includes("yahoo api error (400)"))
  );
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<FetchResult<T>> {
  const base = await getBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;

  logger.debug({ module: "fetcher", path }, "apiFetch called");
  try {
    const res = await fetch(url, {
      // Server components: avoid Next's full-route static caching surprise;
      // each API route enforces its own cache TTL via our cache layer.
      cache: "no-store",
      ...init,
    });

    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      let body: Record<string, unknown> | null = null;
      try {
        body = (await res.json()) as Record<string, unknown>;
        if (body && typeof body === "object" && "error" in body) {
          message = String(body.error ?? message);
        }
      } catch {
        // ignore body parse errors
      }
      logger.warn({ module: "fetcher", path, status: res.status }, "apiFetch non-ok response");
      return {
        ok: false,
        status: res.status,
        message,
        notConfigured: looksLikeConfigError(res.status, message),
        accessDenied: looksLikeAccessDenied(res.status, message),
        offseason: looksLikeOffseasonError(res.status, body, message),
      };
    }

    const data = (await res.json()) as T;
    logger.debug({ module: "fetcher", path, status: res.status }, "apiFetch succeeded");
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error({ module: "fetcher", path, err }, "apiFetch network error");
    return {
      ok: false,
      status: 0,
      message,
      notConfigured: looksLikeConfigError(0, message),
      accessDenied: looksLikeAccessDenied(0, message),
      offseason: looksLikeOffseasonError(0, null, message),
    };
  }
}
