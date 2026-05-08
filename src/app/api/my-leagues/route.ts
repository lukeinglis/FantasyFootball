import { NextRequest, NextResponse } from "next/server";
import { getValidToken } from "@/lib/yahoo/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const YAHOO_API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

/* eslint-disable @typescript-eslint/no-explicit-any */
function dig(obj: any, ...keys: string[]): any {
  let current = obj;
  for (const key of keys) {
    if (current == null) return undefined;
    current = current[key];
  }
  return current;
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

    // Get all the user's NFL leagues across all seasons
    const url = `${YAHOO_API_BASE}/users;use_login=1/games;game_codes=nfl/leagues?format=json`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({ error: `API ${res.status}`, body: body.slice(0, 500) }, { status: 500 });
    }

    const raw = await res.json();
    const users = dig(raw, "fantasy_content", "users", "0", "user");
    const gamesData = Array.isArray(users) ? users[1]?.games : {};
    const gamesCount = gamesData?.count || 0;

    interface LeagueInfo {
      season: string;
      gameKey: string;
      leagueKey: string;
      leagueId: string;
      leagueName: string;
    }

    const leagues: LeagueInfo[] = [];

    for (let g = 0; g < gamesCount; g++) {
      const game = gamesData[g]?.game;
      if (!game) continue;
      const gameInfo = Array.isArray(game) ? game[0] : game;
      const leaguesObj = Array.isArray(game) ? game[1]?.leagues : {};
      const leaguesCount = leaguesObj?.count || 0;

      for (let l = 0; l < leaguesCount; l++) {
        const league = leaguesObj[l]?.league;
        const leagueMeta = Array.isArray(league) ? league[0] : league;
        if (leagueMeta) {
          leagues.push({
            season: gameInfo?.season || "",
            gameKey: gameInfo?.game_key || "",
            leagueKey: leagueMeta.league_key || "",
            leagueId: String(leagueMeta.league_id || ""),
            leagueName: leagueMeta.name || "",
          });
        }
      }
    }

    // Filter to just leagues matching our league name or ID
    const targetId = process.env.YAHOO_LEAGUE_ID || "655705";
    const targetName = "greybushes";
    const matching = leagues.filter(
      (l) =>
        l.leagueId === targetId ||
        l.leagueName.toLowerCase().includes(targetName) ||
        l.leagueName.toLowerCase().includes("chili")
    );

    // Now fetch standings for each matching league
    interface SeasonRecord {
      year: number;
      leagueKey: string;
      leagueId: string;
      leagueName: string;
      champion?: string;
      championTeam?: string;
      runnerUp?: string;
      runnerUpTeam?: string;
      third?: string;
      thirdTeam?: string;
      lastPlace?: string;
      lastPlaceTeam?: string;
      teamCount?: number;
    }

    const seasons: SeasonRecord[] = [];

    for (const league of matching) {
      try {
        const standingsUrl = `${YAHOO_API_BASE}/league/${league.leagueKey}/standings?format=json`;
        const standingsRes = await fetch(standingsUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!standingsRes.ok) continue;

        const standingsRaw = await standingsRes.json();
        const leagueData = dig(standingsRaw, "fantasy_content", "league");
        const standingsData = Array.isArray(leagueData) ? leagueData[1]?.standings : null;
        const teamsArray = standingsData?.[0]?.teams || {};
        const count = teamsArray?.count || 0;

        if (count === 0) continue;

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

        const record: SeasonRecord = {
          year: Number(league.season),
          leagueKey: league.leagueKey,
          leagueId: league.leagueId,
          leagueName: league.leagueName,
          teamCount: count,
        };
        if (teams[0]) { record.champion = teams[0].managerName || teams[0].teamName; record.championTeam = teams[0].teamName; }
        if (teams[1]) { record.runnerUp = teams[1].managerName || teams[1].teamName; record.runnerUpTeam = teams[1].teamName; }
        if (teams[2]) { record.third = teams[2].managerName || teams[2].teamName; record.thirdTeam = teams[2].teamName; }
        if (last && last.rank > 2) { record.lastPlace = last.managerName || last.teamName; record.lastPlaceTeam = last.teamName; }

        seasons.push(record);
      } catch {
        continue;
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    seasons.sort((a, b) => b.year - a.year);

    return NextResponse.json({
      allLeagues: leagues,
      matchingLeagues: matching,
      seasonsFound: seasons.length,
      seasons,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
