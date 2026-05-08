import { NextRequest, NextResponse } from "next/server";
import { getValidToken } from "@/lib/yahoo/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const YAHOO_API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

const LEAGUE_KEYS: { year: number; key: string }[] = [
  { year: 2025, key: "461.l.655705" },
  { year: 2024, key: "449.l.374164" },
  { year: 2023, key: "423.l.293965" },
  { year: 2022, key: "414.l.625095" },
  { year: 2021, key: "406.l.693008" },
  { year: 2020, key: "399.l.62032" },
  { year: 2019, key: "390.l.91864" },
  { year: 2018, key: "380.l.129524" },
  { year: 2017, key: "371.l.34938" },
  { year: 2016, key: "359.l.66864" },
  { year: 2015, key: "348.l.227105" },
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

interface DraftPick {
  pick: number;
  round: number;
  teamKey: string;
  teamName: string;
  managerName: string;
  playerKey: string;
  playerName: string;
  position: string;
  nflTeam: string;
}

interface SeasonDraft {
  year: number;
  leagueKey: string;
  picks: DraftPick[];
  teams: { teamKey: string; teamName: string; managerName: string }[];
}

async function fetchDraftForSeason(
  year: number,
  leagueKey: string,
  token: string
): Promise<SeasonDraft | null> {
  try {
    // Fetch draft results with player details
    const draftUrl = `${YAHOO_API_BASE}/league/${leagueKey}/draftresults?format=json`;
    const draftRes = await fetch(draftUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!draftRes.ok) return null;

    const draftRaw = await draftRes.json();
    const league = dig(draftRaw, "fantasy_content", "league");
    const draftData = Array.isArray(league) ? league[1]?.draft_results : {};
    const count = draftData?.count || 0;

    if (count === 0) return null;

    // Also fetch teams for this season
    const teamsUrl = `${YAHOO_API_BASE}/league/${leagueKey}/teams?format=json`;
    const teamsRes = await fetch(teamsUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const teamMap: Record<string, { teamName: string; managerName: string }> = {};
    const teamsList: { teamKey: string; teamName: string; managerName: string }[] = [];

    if (teamsRes.ok) {
      const teamsRaw = await teamsRes.json();
      const teamsLeague = dig(teamsRaw, "fantasy_content", "league");
      const teamsData = Array.isArray(teamsLeague) ? teamsLeague[1]?.teams : {};
      const tCount = teamsData?.count || 0;

      for (let i = 0; i < tCount; i++) {
        const teamData = teamsData[i]?.team;
        if (!teamData) continue;
        const info = Array.isArray(teamData) ? teamData[0] : teamData;
        const infoArray = Array.isArray(info) ? info : [info];
        const flat: Record<string, any> = {};
        for (const item of infoArray) {
          if (typeof item === "object" && item !== null) Object.assign(flat, item);
        }
        const entry = {
          teamKey: flat.team_key || "",
          teamName: flat.name || "",
          managerName: flat.managers?.[0]?.manager?.nickname || "",
        };
        teamMap[entry.teamKey] = entry;
        teamsList.push(entry);
      }
    }

    // Collect all player keys for batch lookup
    const playerKeys: string[] = [];
    const rawPicks: { pick: number; round: number; teamKey: string; playerKey: string }[] = [];

    for (let i = 0; i < count; i++) {
      const pick = draftData[i]?.draft_result;
      if (!pick) continue;
      rawPicks.push({
        pick: pick.pick || i + 1,
        round: pick.round || 0,
        teamKey: pick.team_key || "",
        playerKey: pick.player_key || "",
      });
      if (pick.player_key) playerKeys.push(pick.player_key);
    }

    // Batch lookup player details (25 at a time)
    const playerMap: Record<string, { name: string; position: string; nflTeam: string }> = {};
    for (let batch = 0; batch < playerKeys.length; batch += 25) {
      const chunk = playerKeys.slice(batch, batch + 25);
      const keysParam = chunk.join(",");
      try {
        const pUrl = `${YAHOO_API_BASE}/players;player_keys=${keysParam}?format=json`;
        const pRes = await fetch(pUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pRes.ok) {
          const pRaw = await pRes.json();
          const players = dig(pRaw, "fantasy_content", "players");
          const pCount = players?.count || 0;
          for (let j = 0; j < pCount; j++) {
            const p = players[j]?.player;
            if (!p) continue;
            const pInfo = Array.isArray(p) ? p[0] : p;
            const pInfoArray = Array.isArray(pInfo) ? pInfo : [pInfo];
            const pFlat: Record<string, any> = {};
            for (const item of pInfoArray) {
              if (typeof item === "object" && item !== null) Object.assign(pFlat, item);
            }
            playerMap[pFlat.player_key || ""] = {
              name: pFlat.name?.full || "",
              position: pFlat.display_position || "",
              nflTeam: pFlat.editorial_team_abbr || "",
            };
          }
        }
      } catch { /* skip batch */ }
      await new Promise((r) => setTimeout(r, 200));
    }

    const picks: DraftPick[] = rawPicks.map((rp) => {
      const team = teamMap[rp.teamKey];
      const player = playerMap[rp.playerKey];
      return {
        pick: rp.pick,
        round: rp.round,
        teamKey: rp.teamKey,
        teamName: team?.teamName || "",
        managerName: team?.managerName || "",
        playerKey: rp.playerKey,
        playerName: player?.name || "",
        position: player?.position || "",
        nflTeam: player?.nflTeam || "",
      };
    });

    return { year, leagueKey, picks, teams: teamsList };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const yearParam = request.nextUrl.searchParams.get("year");
  const token = await getValidToken();

  if (yearParam) {
    const year = Number(yearParam);
    const entry = LEAGUE_KEYS.find((l) => l.year === year);
    if (!entry) {
      return NextResponse.json({ error: `No league found for year ${year}` }, { status: 404 });
    }
    const result = await fetchDraftForSeason(year, entry.key, token);
    if (!result) {
      return NextResponse.json({ error: `Could not fetch draft for ${year}` }, { status: 500 });
    }
    return NextResponse.json(result);
  }

  // Fetch all years
  const drafts: SeasonDraft[] = [];
  for (const entry of LEAGUE_KEYS) {
    const result = await fetchDraftForSeason(entry.year, entry.key, token);
    if (result) drafts.push(result);
    await new Promise((r) => setTimeout(r, 300));
  }

  return NextResponse.json({
    found: drafts.length,
    drafts: drafts.map((d) => ({
      year: d.year,
      totalPicks: d.picks.length,
      rounds: Math.max(...d.picks.map((p) => p.round), 0),
      teams: d.teams.length,
    })),
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
