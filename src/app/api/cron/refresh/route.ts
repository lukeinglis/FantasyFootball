import { NextRequest, NextResponse } from "next/server";
import { getStandings, getScoreboard, getTransactions, getTeams } from "@/lib/yahoo/client";

/**
 * GET /api/cron/refresh
 * Vercel Cron endpoint that pre-fetches and caches league data.
 * Protected by CRON_SECRET to prevent unauthorized access.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  // Fetch data in parallel to warm the cache
  const fetches = [
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
        results[name] = `error: ${error instanceof Error ? error.message : "unknown"}`;
        console.error(`Cron refresh failed for ${name}:`, error);
      }
    })
  );

  return NextResponse.json({
    refreshedAt: new Date().toISOString(),
    results,
  });
}
