import { NextRequest, NextResponse } from "next/server";
import { getValidToken } from "@/lib/yahoo/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const YAHOO_API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";
const LEAGUE_ID = process.env.YAHOO_LEAGUE_ID || "655705";

// Correct NFL game keys confirmed via Yahoo API discovery
const GAME_KEYS: { year: number; key: string }[] = [
  { year: 2025, key: "461" },
  { year: 2024, key: "449" },
  { year: 2023, key: "423" },
  { year: 2022, key: "414" },
  { year: 2021, key: "406" },
  { year: 2020, key: "399" },
  { year: 2019, key: "390" },
  { year: 2018, key: "380" },
  { year: 2017, key: "371" },
  { year: 2016, key: "359" },
  { year: 2015, key: "348" },
  { year: 2014, key: "331" },
  { year: 2013, key: "314" },
];

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

interface FetchError {
  year: number;
  gameKey: string;
  status: number;
  snippet: string;
}

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
    const errors: FetchError[] = [];

    for (const { year, key } of GAME_KEYS) {
      const leagueKey = `${key}.l.${LEAGUE_ID}`;
      try {
        const url = `${YAHOO_API_BASE}/league/${leagueKey}/standings?format=json`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const body = await res.text();
          errors.push({ year, gameKey: key, status: res.status, snippet: body.slice(0, 150) });
          continue;
        }

        const raw = await res.json();
        const league = dig(raw, "fantasy_content", "league");
        const standingsData = Array.isArray(league) ? league[1]?.standings : null;
        const teamsArray = standingsData?.[0]?.teams || {};
        const count = teamsArray?.count || 0;

        if (count === 0) {
          errors.push({ year, gameKey: key, status: 200, snippet: "No teams in response" });
          continue;
        }

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

        seasons.push(record);
      } catch (e) {
        errors.push({ year, gameKey: key, status: 0, snippet: e instanceof Error ? e.message : "Unknown" });
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    seasons.sort((a, b) => b.year - a.year);

    return NextResponse.json({
      found: seasons.length,
      seasons,
      errors,
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
/* eslint-enable @typescript-eslint/no-explicit-any */
