import { NextRequest, NextResponse } from "next/server";
import { getValidToken } from "@/lib/yahoo/auth";

export const runtime = "nodejs";

const YAHOO_API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";
const LEAGUE_ID = process.env.YAHOO_LEAGUE_ID || "655705";

const NFL_GAME_KEYS: Record<number, string> = {
  2013: "314",
  2014: "331",
  2015: "348",
  2016: "359",
  2017: "371",
  2018: "380",
  2019: "390",
  2020: "399",
  2021: "406",
  2022: "414",
  2023: "423",
  2024: "449",
  2025: "461",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function dig(obj: any, ...keys: string[]): any {
  let current = obj;
  for (const key of keys) {
    if (current == null) return undefined;
    current = current[key];
  }
  return current;
}

interface SeasonRecord {
  year: number;
  champion?: string;
  championTeam?: string;
  runnerUp?: string;
  runnerUpTeam?: string;
  third?: string;
  thirdTeam?: string;
  lastPlace?: string;
  lastPlaceTeam?: string;
}

async function fetchSeasonStandings(
  year: number,
  gameKey: string,
  token: string
): Promise<SeasonRecord | null> {
  const leagueKey = `${gameKey}.l.${LEAGUE_ID}`;

  try {
    const url = `${YAHOO_API_BASE}/league/${leagueKey}/standings?format=json`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;

    const raw = await res.json();
    const league = dig(raw, "fantasy_content", "league");
    const standingsData = Array.isArray(league) ? league[1]?.standings : null;
    const teamsArray = standingsData?.[0]?.teams || {};
    const count = teamsArray?.count || 0;

    if (count === 0) return null;

    interface TeamInfo { rank: number; teamName: string; managerName: string }
    const teams: TeamInfo[] = [];

    for (let i = 0; i < count; i++) {
      const teamData = teamsArray[i]?.team;
      if (!teamData) continue;

      const info = Array.isArray(teamData) ? teamData[0] : teamData;
      const standings = Array.isArray(teamData) ? teamData[1]?.team_standings : null;
      const infoArray = Array.isArray(info) ? info : [info];
      const flat: Record<string, any> = {};
      for (const item of infoArray) {
        if (typeof item === "object" && item !== null) Object.assign(flat, item);
      }

      teams.push({
        rank: standings?.rank || 99,
        teamName: flat.name || "",
        managerName: flat.managers?.[0]?.manager?.nickname || "",
      });
    }

    teams.sort((a, b) => a.rank - b.rank);
    const last = [...teams].sort((a, b) => b.rank - a.rank)[0];

    const record: SeasonRecord = { year };
    if (teams[0]) { record.champion = teams[0].managerName || teams[0].teamName; record.championTeam = teams[0].teamName; }
    if (teams[1]) { record.runnerUp = teams[1].managerName || teams[1].teamName; record.runnerUpTeam = teams[1].teamName; }
    if (teams[2]) { record.third = teams[2].managerName || teams[2].teamName; record.thirdTeam = teams[2].teamName; }
    if (last && last.rank > 2) { record.lastPlace = last.managerName || last.teamName; record.lastPlaceTeam = last.teamName; }

    return record;
  } catch {
    return null;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const token = await getValidToken();
    const seasons: SeasonRecord[] = [];

    for (const [yearStr, gameKey] of Object.entries(NFL_GAME_KEYS)) {
      const year = Number(yearStr);
      const record = await fetchSeasonStandings(year, gameKey, token);
      if (record) seasons.push(record);
      await new Promise((r) => setTimeout(r, 500));
    }

    seasons.sort((a, b) => b.year - a.year);

    return NextResponse.json({
      found: seasons.length,
      seasons,
      punishments: seasons
        .filter((s) => s.lastPlace)
        .map((s) => ({ season: s.year, loser: s.lastPlace, team: s.lastPlaceTeam })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
