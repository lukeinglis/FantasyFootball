import { NextRequest, NextResponse } from "next/server";
import {
  getStandings,
  getScoreboard,
  getTransactions,
  getTeams,
} from "@/lib/yahoo/client";

export const runtime = "nodejs";

/**
 * GET /api/cron/refresh
 * Vercel Cron endpoint that pre-fetches and caches league data.
 *
 * Auth: requires Authorization: Bearer <CRON_SECRET>. CRON_SECRET MUST be
 * configured in production; without it the route returns 503 to avoid an
 * unauthenticated cache-warmer that anyone could spam.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      {
        error:
          "CRON_SECRET is not configured. Set it in your environment to enable this endpoint.",
      },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${cronSecret}`;
  const isVercelCron = request.headers.get("x-vercel-cron") !== null;

  if (authHeader !== expected) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        hint: isVercelCron
          ? "Vercel cron header detected but Authorization Bearer did not match CRON_SECRET."
          : "Provide Authorization: Bearer <CRON_SECRET>.",
      },
      { status: 401 }
    );
  }

  const results: Record<string, string> = {};

  const fetches: { name: string; fn: () => Promise<unknown> }[] = [
    { name: "standings", fn: () => getStandings() },
    { name: "scoreboard", fn: () => getScoreboard() },
    { name: "transactions", fn: () => getTransactions() },
    { name: "teams", fn: () => getTeams() },
  ];

  await Promise.allSettled(
    fetches.map(async ({ name, fn }) => {
      try {
        await fn();
        results[name] = "ok";
      } catch (error) {
        results[name] = `error: ${
          error instanceof Error ? error.message : "unknown"
        }`;
        console.error(`Cron refresh failed for ${name}:`, error);
      }
    })
  );

  const allOk = Object.values(results).every((v) => v === "ok");
  return NextResponse.json(
    {
      refreshedAt: new Date().toISOString(),
      ok: allOk,
      results,
    },
    { status: allOk ? 200 : 207 }
  );
}
