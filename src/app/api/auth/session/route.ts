import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import logger from "@/lib/logger";

/**
 * GET /api/auth/session
 * Returns the current user session (name + avatar) or null.
 * Used by client components to check sign-in state.
 */
export async function GET() {
  logger.info({ route: "/api/auth/session" }, "session check started");
  const session = await getSession();
  logger.info({ route: "/api/auth/session", hasSession: !!session }, "session check completed");
  return NextResponse.json({ user: session });
}
