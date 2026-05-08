import { NextRequest, NextResponse } from "next/server";
import { getValidToken } from "@/lib/yahoo/auth";

export const runtime = "nodejs";

const YAHOO_API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";
const LEAGUE_ID = process.env.YAHOO_LEAGUE_ID || "655705";

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

    // Step 1: Get all NFL game keys from Yahoo
    const gamesUrl = `${YAHOO_API_BASE}/users;use_login=1/games;game_codes=nfl?format=json`;
    const gamesRes = await fetch(gamesUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!gamesRes.ok) {
      return NextResponse.json({
        error: `Games API failed: ${gamesRes.status}`,
        body: await gamesRes.text(),
      }, { status: 500 });
    }

    const gamesRaw = await gamesRes.json();
    const users = dig(gamesRaw, "fantasy_content", "users", "0", "user");
    const gamesData = Array.isArray(users) ? users[1]?.games : {};
    const gamesCount = gamesData?.count || 0;

    interface GameInfo { gameKey: string; season: string; code: string }
    const games: GameInfo[] = [];

    for (let i = 0; i < gamesCount; i++) {
      const game = gamesData[i]?.game;
      const info = Array.isArray(game) ? game[0] : game;
      if (info?.game_key) {
        games.push({
          gameKey: info.game_key,
          season: info.season || "",
          code: info.code || "",
        });
      }
    }

    // Step 2: For each game key, try to get standings for the league
    interface SeasonResult {
      year: number;
      gameKey: string;
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

    const seasons: SeasonResult[] = [];

    for (const game of games) {
      const leagueKey = `${game.gameKey}.l.${LEAGUE_ID}`;
      try {
        const url = `${YAHOO_API_BASE}/league/${leagueKey}/standings?format=json`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) continue;

        const raw = await res.json();
        const league = dig(raw, "fantasy_content", "league");
        const standingsData = Array.isArray(league) ? league[1]?.standings : null;
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

        const result: SeasonResult = {
          year: Number(game.season),
          gameKey: game.gameKey,
          teamCount: count,
        };
        if (teams[0]) { result.champion = teams[0].managerName || teams[0].teamName; result.championTeam = teams[0].teamName; }
        if (teams[1]) { result.runnerUp = teams[1].managerName || teams[1].teamName; result.runnerUpTeam = teams[1].teamName; }
        if (teams[2]) { result.third = teams[2].managerName || teams[2].teamName; result.thirdTeam = teams[2].teamName; }
        if (last && last.rank > 2) { result.lastPlace = last.managerName || last.teamName; result.lastPlaceTeam = last.teamName; }

        seasons.push(result);
      } catch {
        continue;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    seasons.sort((a, b) => b.year - a.year);

    return NextResponse.json({
      gamesFound: games.length,
      games,
      seasonsFound: seasons.length,
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
/* eslint-enable @typescript-eslint/no-explicit-any */
