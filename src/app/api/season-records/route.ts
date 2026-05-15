import { NextRequest, NextResponse } from "next/server";
import { getValidToken } from "@/lib/yahoo/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const YAHOO_API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

// All historical league keys
const LEAGUE_KEYS: { season: number; key: string }[] = [
  { season: 2025, key: "461.l.655705" },
  { season: 2024, key: "449.l.374164" },
  { season: 2023, key: "423.l.293965" },
  { season: 2022, key: "414.l.625095" },
  { season: 2021, key: "406.l.693008" },
  { season: 2020, key: "399.l.62032" },
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

interface WeekScore {
  week: number;
  season: number;
  teamName: string;
  managerName: string;
  points: number;
  projectedPoints: number;
  opponentName: string;
  opponentPoints: number;
  won: boolean;
  margin: number;
  isPlayoffs: boolean;
}

interface PlayerWeekStat {
  week: number;
  season: number;
  teamName: string;
  managerName: string;
  playerName: string;
  position: string;
  nflTeam: string;
  points: number;
  selectedPosition: string;
}

async function fetchSeasonScoreboards(
  leagueKey: string,
  season: number,
  token: string,
  maxWeek: number,
): Promise<WeekScore[]> {
  const scores: WeekScore[] = [];

  for (let week = 1; week <= maxWeek; week++) {
    try {
      const url = `${YAHOO_API_BASE}/league/${leagueKey}/scoreboard;week=${week}?format=json`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) break;

      const raw = await res.json();
      const league = dig(raw, "fantasy_content", "league");
      const scoreboardData = Array.isArray(league) ? league[1]?.scoreboard : null;
      const matchupsData = scoreboardData?.[0]?.matchups || {};
      const count = matchupsData?.count || 0;

      for (let i = 0; i < count; i++) {
        const m = matchupsData[i]?.matchup;
        if (!m) continue;
        const teamsData = m[0]?.teams || m?.teams || {};
        const isPlayoffs = m.is_playoffs === "1" || m.is_playoffs === true;

        const teamA = parseMatchupTeam(teamsData[0]?.team);
        const teamB = parseMatchupTeam(teamsData[1]?.team);

        if (teamA.points > 0 || teamB.points > 0) {
          scores.push({
            week, season, isPlayoffs,
            teamName: teamA.teamName, managerName: teamA.managerName,
            points: teamA.points, projectedPoints: teamA.projectedPoints,
            opponentName: teamB.teamName, opponentPoints: teamB.points,
            won: teamA.points > teamB.points,
            margin: Math.abs(teamA.points - teamB.points),
          });
          scores.push({
            week, season, isPlayoffs,
            teamName: teamB.teamName, managerName: teamB.managerName,
            points: teamB.points, projectedPoints: teamB.projectedPoints,
            opponentName: teamA.teamName, opponentPoints: teamA.points,
            won: teamB.points > teamA.points,
            margin: Math.abs(teamA.points - teamB.points),
          });
        }
      }
    } catch { break; }
    await new Promise((r) => setTimeout(r, 200));
  }

  return scores;
}

function parseMatchupTeam(teamData: any): { teamName: string; managerName: string; points: number; projectedPoints: number } {
  if (!teamData) return { teamName: "", managerName: "", points: 0, projectedPoints: 0 };
  const info = Array.isArray(teamData) ? teamData[0] : teamData;
  const pts = Array.isArray(teamData) ? teamData[1]?.team_points : null;
  const proj = Array.isArray(teamData) ? teamData[1]?.team_projected_points : null;
  const infoArray = Array.isArray(info) ? info : [info];
  const flat: Record<string, any> = {};
  for (const item of infoArray) {
    if (typeof item === "object" && item !== null) Object.assign(flat, item);
  }
  return {
    teamName: flat.name || "",
    managerName: flat.managers?.[0]?.manager?.nickname || "",
    points: parseFloat(pts?.total || "0"),
    projectedPoints: parseFloat(proj?.total || "0"),
  };
}

async function fetchRosterStats(
  leagueKey: string,
  teamKey: string,
  week: number,
  season: number,
  teamName: string,
  managerName: string,
  token: string,
): Promise<PlayerWeekStat[]> {
  const stats: PlayerWeekStat[] = [];
  try {
    const url = `${YAHOO_API_BASE}/team/${teamKey}/roster;week=${week}/players/stats?format=json`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return stats;

    const raw = await res.json();
    const team = dig(raw, "fantasy_content", "team");
    const rosterData = Array.isArray(team) ? team[1]?.roster : null;
    const playersData = rosterData?.[0]?.players || {};
    const count = playersData?.count || 0;

    for (let j = 0; j < count; j++) {
      const p = playersData[j]?.player;
      if (!p) continue;
      const pInfo = Array.isArray(p) ? p[0] : p;
      const pStats = Array.isArray(p) ? p[1]?.player_points : null;
      const selectedPos = Array.isArray(p) ? p[1]?.selected_position?.[1]?.position : null;

      const pInfoArray = Array.isArray(pInfo) ? pInfo : [pInfo];
      const pFlat: Record<string, any> = {};
      for (const item of pInfoArray) {
        if (typeof item === "object" && item !== null) Object.assign(pFlat, item);
      }

      const playerPts = parseFloat(pStats?.total || "0");
      if (playerPts !== 0) {
        stats.push({
          week, season, teamName, managerName,
          playerName: pFlat.name?.full || "",
          position: pFlat.display_position || "",
          nflTeam: pFlat.editorial_team_abbr || "",
          points: playerPts,
          selectedPosition: selectedPos || pFlat.display_position || "",
        });
      }
    }
  } catch { /* skip */ }
  return stats;
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const seasonParam = request.nextUrl.searchParams.get("season") || "2025";
  const season = Number(seasonParam);
  const entry = LEAGUE_KEYS.find((l) => l.season === season);
  if (!entry) {
    return NextResponse.json({ error: `No league key for ${season}` }, { status: 404 });
  }

  const includePlayerStats = request.nextUrl.searchParams.get("players") === "true";
  const topWeekParam = request.nextUrl.searchParams.get("topWeek");

  try {
    const token = await getValidToken();

    // First get settings to know how many weeks
    let maxWeek = 17;
    try {
      const settingsUrl = `${YAHOO_API_BASE}/league/${entry.key}/settings?format=json`;
      const sRes = await fetch(settingsUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (sRes.ok) {
        const sRaw = await sRes.json();
        const sMeta = Array.isArray(dig(sRaw, "fantasy_content", "league"))
          ? dig(sRaw, "fantasy_content", "league")[0]
          : dig(sRaw, "fantasy_content", "league");
        maxWeek = sMeta?.end_week || sMeta?.current_week || 17;
      }
    } catch { /* use default */ }

    // Fetch all scoreboards
    const weekScores = await fetchSeasonScoreboards(entry.key, season, token, maxWeek);

    // Optionally fetch player stats for a specific top-scoring week
    let playerStats: PlayerWeekStat[] = [];
    if (includePlayerStats && topWeekParam) {
      const topWeek = Number(topWeekParam);
      // Get all team keys from standings
      const standingsUrl = `${YAHOO_API_BASE}/league/${entry.key}/standings?format=json`;
      const stRes = await fetch(standingsUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (stRes.ok) {
        const stRaw = await stRes.json();
        const stLeague = dig(stRaw, "fantasy_content", "league");
        const stData = Array.isArray(stLeague) ? stLeague[1]?.standings : null;
        const stTeams = stData?.[0]?.teams || {};
        const stCount = stTeams?.count || 0;

        for (let i = 0; i < stCount; i++) {
          const td = stTeams[i]?.team;
          if (!td) continue;
          const info = Array.isArray(td) ? td[0] : td;
          const infoArray = Array.isArray(info) ? info : [info];
          const flat: Record<string, any> = {};
          for (const item of infoArray) {
            if (typeof item === "object" && item !== null) Object.assign(flat, item);
          }
          const teamKey = flat.team_key;
          const teamName = flat.name || "";
          const mgrName = flat.managers?.[0]?.manager?.nickname || "";
          if (teamKey) {
            const ps = await fetchRosterStats(entry.key, teamKey, topWeek, season, teamName, mgrName, token);
            playerStats.push(...ps);
            await new Promise((r) => setTimeout(r, 150));
          }
        }
      }
    }

    return NextResponse.json({
      season,
      leagueKey: entry.key,
      totalWeekScores: weekScores.length,
      weekScores,
      playerStats,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
