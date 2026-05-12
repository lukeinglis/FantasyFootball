import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/**
 * GET /api/auth/session
 * Returns the current user session (name + avatar) or null.
 * Used by client components to check sign-in state.
 */
export async function GET() {
  const session = await getSession();
  return NextResponse.json({ user: session });
}
