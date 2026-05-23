import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import logger from "@/lib/logger";

// ============================================================
// Breakaway Game Leaderboard API
// Uses Vercel KV for persistent storage
// ============================================================

const LEADERBOARD_KEY = "game:breakaway:leaderboard";
const MAX_ENTRIES = 10;

interface LeaderboardEntry {
  name: string;
  yards: number;
  date: string;
}

async function getKv() {
  const { kv } = await import("@vercel/kv");
  return kv;
}

/**
 * GET /api/game
 * Returns the top 10 leaderboard entries.
 */
export async function GET() {
  logger.info({ route: "/api/game" }, "GET request started");
  try {
    const kv = await getKv();
    const entries = await kv.get<LeaderboardEntry[]>(LEADERBOARD_KEY);
    logger.info({ route: "/api/game" }, "GET request completed");
    return NextResponse.json({ leaderboard: entries ?? [] });
  } catch (err) {
    logger.error({ route: "/api/game", err }, "leaderboard GET failed");
    return NextResponse.json({ leaderboard: [] });
  }
}

/**
 * POST /api/game
 * Submit a score. Requires authenticated session.
 * Body: { yards: number }
 */
export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id");
  const log = requestId ? logger.child({ requestId }) : logger;
  log.info({ route: "/api/game" }, "POST request started");
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Sign in to save your score" },
      { status: 401 }
    );
  }

  let body: { yards?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const yards = body.yards;
  if (typeof yards !== "number" || !Number.isFinite(yards) || yards < 0) {
    return NextResponse.json(
      { error: "Invalid score" },
      { status: 400 }
    );
  }

  // Cap at a sane maximum to prevent spoofing absurd values
  const cappedYards = Math.min(Math.floor(yards), 99999);

  try {
    const kv = await getKv();
    const existing = (await kv.get<LeaderboardEntry[]>(LEADERBOARD_KEY)) ?? [];

    const entry: LeaderboardEntry = {
      name: session.name,
      yards: cappedYards,
      date: new Date().toISOString().slice(0, 10),
    };

    const updated = [...existing, entry]
      .sort((a, b) => b.yards - a.yards)
      .slice(0, MAX_ENTRIES);

    await kv.set(LEADERBOARD_KEY, updated);

    const rank = updated.findIndex(
      (e) => e.name === entry.name && e.yards === entry.yards
    );

    log.info({ route: "/api/game", rank: rank >= 0 ? rank + 1 : null }, "POST request completed");
    return NextResponse.json({
      rank: rank >= 0 ? rank + 1 : null,
      leaderboard: updated,
    });
  } catch (err) {
    log.error({ route: "/api/game", err }, "leaderboard POST failed");
    return NextResponse.json(
      { error: "Could not save score" },
      { status: 500 }
    );
  }
}
