import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import logger from "@/lib/logger";

// ============================================================
// Field Goal Frenzy Leaderboard API
// Uses Vercel KV for persistent storage
// ============================================================

const LEADERBOARD_KEY = "game:fieldgoal:leaderboard";
const MAX_ENTRIES = 10;

interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

async function getKv() {
  const { kv } = await import("@vercel/kv");
  return kv;
}

/**
 * GET /api/game/fieldgoal
 * Returns the top 10 leaderboard entries.
 */
export async function GET() {
  logger.info({ route: "/api/game/fieldgoal" }, "GET request started");
  try {
    const kv = await getKv();
    const entries = await kv.get<LeaderboardEntry[]>(LEADERBOARD_KEY);
    logger.info({ route: "/api/game/fieldgoal" }, "GET request completed");
    return NextResponse.json({ leaderboard: entries ?? [] });
  } catch (err) {
    logger.error({ route: "/api/game/fieldgoal", err }, "leaderboard GET failed");
    return NextResponse.json({ leaderboard: [] });
  }
}

/**
 * POST /api/game/fieldgoal
 * Submit a score. Requires authenticated session.
 * Body: { score: number }
 */
export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id");
  const log = requestId ? logger.child({ requestId }) : logger;
  log.info({ route: "/api/game/fieldgoal" }, "POST request started");
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Sign in to save your score" },
      { status: 401 },
    );
  }

  let body: { score?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const score = body.score;
  if (typeof score !== "number" || !Number.isFinite(score) || score < 0) {
    return NextResponse.json(
      { error: "Invalid score" },
      { status: 400 },
    );
  }

  // Cap at a sane maximum to prevent spoofing
  const cappedScore = Math.min(Math.floor(score), 99999);

  try {
    const kv = await getKv();
    const existing =
      (await kv.get<LeaderboardEntry[]>(LEADERBOARD_KEY)) ?? [];

    const entry: LeaderboardEntry = {
      name: session.name,
      score: cappedScore,
      date: new Date().toISOString().slice(0, 10),
    };

    const updated = [...existing, entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_ENTRIES);

    await kv.set(LEADERBOARD_KEY, updated);

    const rank = updated.findIndex(
      (e) => e.name === entry.name && e.score === entry.score,
    );

    log.info({ route: "/api/game/fieldgoal", rank: rank >= 0 ? rank + 1 : null }, "POST request completed");
    return NextResponse.json({
      rank: rank >= 0 ? rank + 1 : null,
      leaderboard: updated,
    });
  } catch (err) {
    log.error({ route: "/api/game/fieldgoal", err }, "leaderboard POST failed");
    return NextResponse.json(
      { error: "Could not save score" },
      { status: 500 },
    );
  }
}
