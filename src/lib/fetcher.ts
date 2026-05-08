// ============================================================
// Server-side fetcher for our own /api/yahoo/* routes.
// Used by server components. Returns null on any failure so
// pages can render a graceful "not connected" state.
// ============================================================

import { headers } from "next/headers";

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
      /** True when the API is connected but no active season data exists (offseason). */
      offseason: boolean;
    };

/** Best-effort detection that the API is reporting a config issue. */
function looksLikeConfigError(status: number, message: string): boolean {
  if (status === 401 || status === 403) return true;
  const lower = (message || "").toLowerCase();
  return (
    lower.includes("yahoo_client_id") ||
    lower.includes("yahoo_client_secret") ||
    lower.includes("no yahoo tokens") ||
    lower.includes("authorize") ||
    lower.includes("not configured")
  );
}

/** Detect offseason/no-active-season errors from structured API responses. */
function looksLikeOffseasonError(status: number, body: Record<string, unknown> | null): boolean {
  if (status === 503 && body?.offseason === true) return true;
  const message = String(body?.error ?? body?.detail ?? "").toLowerCase();
  return (
    message.includes("no active season") ||
    message.includes("(400)") ||
    message.includes("failed to resolve nfl game key")
  );
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<FetchResult<T>> {
  const base = await getBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;

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
      return {
        ok: false,
        status: res.status,
        message,
        notConfigured: looksLikeConfigError(res.status, message),
        offseason: looksLikeOffseasonError(res.status, body),
      };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      ok: false,
      status: 0,
      message,
      notConfigured: looksLikeConfigError(0, message),
      offseason: false,
    };
  }
}
