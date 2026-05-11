import { NextRequest, NextResponse } from "next/server";
import { getValidToken } from "@/lib/yahoo/auth";

export const runtime = "nodejs";

const YAHOO_API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

const LEAGUE_KEYS: Record<number, string> = {
  2025: "461.l.655705",
  2024: "449.l.374164",
  2023: "423.l.293965",
};

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const yearParam = request.nextUrl.searchParams.get("year") || "2025";
  const year = Number(yearParam);
  const leagueKey = LEAGUE_KEYS[year];
  if (!leagueKey) {
    return NextResponse.json({ error: `No league key for ${year}` }, { status: 404 });
  }

  try {
    const token = await getValidToken();
    const url = `${YAHOO_API_BASE}/league/${leagueKey}/draftresults?format=json`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Yahoo ${res.status}`, body: await res.text() }, { status: 500 });
    }

    const raw = await res.json();

    // Extract the first 5 raw draft_result objects to see all fields
    const league = raw?.fantasy_content?.league;
    const draftData = Array.isArray(league) ? league[1]?.draft_results : {};
    const count = draftData?.count || 0;

    const samples = [];
    for (let i = 0; i < Math.min(count, 24); i++) {
      const pick = draftData[i]?.draft_result;
      if (pick) samples.push(pick);
    }

    return NextResponse.json({
      year,
      leagueKey,
      totalPicks: count,
      samplePicks: samples,
      allFields: samples.length > 0 ? Object.keys(samples[0]) : [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
