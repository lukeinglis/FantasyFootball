import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

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
  try {
    const kv = await getKv();
    const entries = await kv.get<LeaderboardEntry[]>(LEADERBOARD_KEY);
    return NextResponse.json({ leaderboard: entries ?? [] });
  } catch (err) {
    console.error("Leaderboard GET error:", err);
    // Return empty leaderboard if KV is unavailable (local dev)
    return NextResponse.json({ leaderboard: [] });
  }
}

/**
 * POST /api/game
 * Submit a score. Requires authenticated session.
 * Body: { yards: number }
 */
export async function POST(request: NextRequest) {
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

    return NextResponse.json({
      rank: rank >= 0 ? rank + 1 : null,
      leaderboard: updated,
    });
  } catch (err) {
    console.error("Leaderboard POST error:", err);
    return NextResponse.json(
      { error: "Could not save score" },
      { status: 500 }
    );
  }
}
