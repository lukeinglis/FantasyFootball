import { NextRequest, NextResponse } from "next/server";
import { getValidToken } from "@/lib/yahoo/auth";

export const runtime = "nodejs";
export const maxDuration = 300;

const YAHOO_API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

const LEAGUE_KEYS: { season: number; key: string }[] = [
  { season: 2025, key: "461.l.655705" },
  { season: 2024, key: "449.l.374164" },
  { season: 2023, key: "423.l.293965" },
  { season: 2022, key: "414.l.625095" },
  { season: 2021, key: "406.l.693008" },
  { season: 2020, key: "399.l.62032" },
  { season: 2019, key: "390.l.91864" },
  { season: 2018, key: "380.l.129524" },
  { season: 2017, key: "371.l.34938" },
  { season: 2016, key: "359.l.66864" },
  { season: 2015, key: "348.l.227105" },
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

function parseTeam(teamData: any): { name: string; manager: string; points: number } {
  if (!teamData) return { name: "", manager: "", points: 0 };
  const info = Array.isArray(teamData) ? teamData[0] : teamData;
  const pts = Array.isArray(teamData) ? teamData[1]?.team_points : null;
  const infoArr = Array.isArray(info) ? info : [info];
  const flat: Record<string, any> = {};
  for (const item of infoArr) {
    if (typeof item === "object" && item !== null) Object.assign(flat, item);
  }
  return {
    name: flat.name || "",
    manager: flat.managers?.[0]?.manager?.nickname || "",
    points: parseFloat(pts?.total || "0"),
  };
}

const TEMP_SECRET = "gcdf-history-2026";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (key !== TEMP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const seasonParam = request.nextUrl.searchParams.get("season");
  if (!seasonParam) {
    return NextResponse.json({
      usage: "GET /api/history-dump?key=SECRET&season=2024",
      available: LEAGUE_KEYS.map(l => l.season),
    });
  }

  const season = Number(seasonParam);
  const entry = LEAGUE_KEYS.find(l => l.season === season);
  if (!entry) {
    return NextResponse.json({ error: `No league key for ${season}` }, { status: 404 });
  }

  try {
    const token = await getValidToken();

    // Get settings
    let endWeek = 16;
    let playoffStart = 14;
    try {
      const sUrl = `${YAHOO_API_BASE}/league/${entry.key}/settings?format=json`;
      const sRes = await fetch(sUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (sRes.ok) {
        const sRaw = await sRes.json();
        const league = dig(sRaw, "fantasy_content", "league");
        const meta = Array.isArray(league) ? league[0] : league;
        const settings = Array.isArray(league) ? league[1]?.settings?.[0] : {};
        endWeek = meta?.end_week || 16;
        playoffStart = settings?.playoff_start_week || meta?.playoff_start_week || 14;
      }
    } catch {}

    // Get standings
    const standings: any[] = [];
    try {
      const stUrl = `${YAHOO_API_BASE}/league/${entry.key}/standings?format=json`;
      const stRes = await fetch(stUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (stRes.ok) {
        const stRaw = await stRes.json();
        const stLeague = dig(stRaw, "fantasy_content", "league");
        const stData = Array.isArray(stLeague) ? stLeague[1]?.standings : null;
        const stTeams = stData?.[0]?.teams || {};
        const count = stTeams?.count || 0;

        for (let i = 0; i < count; i++) {
          const td = stTeams[i]?.team;
          if (!td) continue;
          const info = Array.isArray(td) ? td[0] : td;
          const st = Array.isArray(td) ? td[1]?.team_standings : null;
          const infoArr = Array.isArray(info) ? info : [info];
          const flat: Record<string, any> = {};
          for (const item of infoArr) {
            if (typeof item === "object" && item !== null) Object.assign(flat, item);
          }

          standings.push({
            teamName: flat.name || "",
            managerName: flat.managers?.[0]?.manager?.nickname || "",
            rank: st?.rank || 0,
            wins: st?.outcome_totals?.wins || 0,
            losses: st?.outcome_totals?.losses || 0,
            ties: st?.outcome_totals?.ties || 0,
            pointsFor: parseFloat(st?.points_for || "0"),
            pointsAgainst: parseFloat(st?.points_against || "0"),
          });
        }
      }
    } catch {}

    // Get all scoreboards
    const matchups: any[] = [];
    for (let week = 1; week <= endWeek; week++) {
      try {
        const url = `${YAHOO_API_BASE}/league/${entry.key}/scoreboard;week=${week}?format=json`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) break;

        const raw = await res.json();
        const league = dig(raw, "fantasy_content", "league");
        const sbData = Array.isArray(league) ? league[1]?.scoreboard : null;
        const mData = sbData?.[0]?.matchups || {};
        const count = mData?.count || 0;

        let hasScores = false;
        for (let i = 0; i < count; i++) {
          const m = mData[i]?.matchup;
          if (!m) continue;
          const teams = m[0]?.teams || m?.teams || {};
          const isPlayoffs = m.is_playoffs === "1" || m.is_playoffs === true;
          const isConsolation = m.is_consolation === "1" || m.is_consolation === true;

          const t1 = parseTeam(teams[0]?.team);
          const t2 = parseTeam(teams[1]?.team);

          if (t1.points === 0 && t2.points === 0) continue;
          hasScores = true;

          matchups.push({
            week, isPlayoffs, isConsolation,
            team1: t1.name, manager1: t1.manager, points1: t1.points,
            team2: t2.name, manager2: t2.manager, points2: t2.points,
          });
        }

        if (!hasScores) break;
      } catch { break; }
      await new Promise(r => setTimeout(r, 200));
    }

    return NextResponse.json({
      season, leagueKey: entry.key,
      endWeek, playoffStart,
      standings,
      totalMatchups: matchups.length,
      matchups,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
