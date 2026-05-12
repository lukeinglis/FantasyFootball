import { cookies } from "next/headers";

// ============================================================
// Cookie-based User Session
// Stores Yahoo nickname after OAuth sign-in
// ============================================================

const SESSION_COOKIE = "ff_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export interface UserSession {
  name: string;
  avatarUrl?: string;
}

/**
 * Read the current user session from the cookie (server-side only).
 * Returns null if the user is not signed in.
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.name === "string" && parsed.name.length > 0) {
      return {
        name: parsed.name,
        avatarUrl: parsed.avatarUrl ?? undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Build a Set-Cookie header value to create or update the session.
 */
export function createSessionCookie(session: UserSession): string {
  const value = JSON.stringify(session);
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(value)}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${SESSION_MAX_AGE}`,
  ];
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
}

/**
 * Build a Set-Cookie header value to clear the session.
 */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
