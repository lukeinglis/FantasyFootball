/**
 * Fetch all-time matchup/scoring records from Yahoo Fantasy API.
 * Uses tokens stored in Vercel KV (from production auth).
 * Outputs results to src/data/all-time-records.json
 *
 * Usage: npx tsx scripts/fetch-all-history.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
const envPath = resolve(import.meta.dirname || __dirname, "../.env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const YAHOO_API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

const LEAGUE_KEYS = [
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

// Token management: fetch live from production API, refresh locally
let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let refreshToken: string | null = null;

async function getTokenViaProduction(): Promise<void> {
  // Hit the production site to get a working token via the existing auth
  // The production site has tokens in KV; we use a lightweight probe to confirm auth works,
  // then get our own token pair via the refresh flow.
  // We need to extract the refresh token from production somehow.
  // Alternative: just use the Yahoo client credentials to get a fresh token pair.

  const clientId = process.env.YAHOO_CLIENT_ID?.replace(/&$/, "");
  const clientSecret = process.env.YAHOO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET required in .env.local");
  }

  // Try to read a locally cached refresh token first
  const tokenCachePath = resolve(import.meta.dirname || __dirname, "../.yahoo-tokens.json");
  try {
    const cached = JSON.parse(readFileSync(tokenCachePath, "utf-8"));
    if (cached.refreshToken) {
      refreshToken = cached.refreshToken;
      cachedToken = cached.accessToken;
      tokenExpiresAt = cached.expiresAt || 0;
      console.log("  Loaded cached tokens from .yahoo-tokens.json");

      // If access token is still valid, use it
      if (Date.now() + 60000 < tokenExpiresAt) {
        console.log("  Access token still valid");
        return;
      }

      // Otherwise refresh
      console.log("  Access token expired, refreshing...");
      await refreshAccessToken();
      saveTokenCache(tokenCachePath);
      return;
    }
  } catch {
    // No cached tokens
  }

  throw new Error(
    "No cached Yahoo tokens found.\n" +
    "Run the dev server and authenticate first:\n" +
    "  1. npm run dev\n" +
    "  2. Visit http://localhost:3000/api/auth/yahoo\n" +
    "Or provide a .yahoo-tokens.json with a refreshToken."
  );
}

function saveTokenCache(path: string): void {
  writeFileSync(path, JSON.stringify({
    accessToken: cachedToken,
    refreshToken: refreshToken,
    expiresAt: tokenExpiresAt,
    savedAt: new Date().toISOString(),
  }, null, 2));
}

async function refreshAccessToken(): Promise<void> {
  if (!refreshToken) throw new Error("No refresh token available");

  const clientId = process.env.YAHOO_CLIENT_ID?.replace(/&$/, "");
  const clientSecret = process.env.YAHOO_CLIENT_SECRET;

  if (!clientId || !clientSecret) throw new Error("YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET required");

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  refreshToken = data.refresh_token || refreshToken;

  console.log("  Token refreshed successfully");
}

async function getToken(): Promise<string> {
  if (!cachedToken) await getTokenViaProduction();

  if (Date.now() + 60000 >= tokenExpiresAt) {
    await refreshAccessToken();
  }

  return cachedToken!;
}

function dig(obj: any, ...keys: string[]): any {
  let current = obj;
  for (const key of keys) {
    if (current == null) return undefined;
    current = current[key];
  }
  return current;
}

async function yahooGet(path: string): Promise<any> {
  const token = await getToken();
  const url = `${YAHOO_API_BASE}${path}${path.includes("?") ? "&" : "?"}format=json`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 999) {
    console.log("    Rate limited, waiting 30s...");
    await new Promise(r => setTimeout(r, 30000));
    return yahooGet(path);
  }

  if (res.status === 401) {
    console.log("    Token expired, refreshing...");
    await refreshAccessToken();
    return yahooGet(path);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yahoo ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json();
}

interface MatchupScore {
  season: number;
  week: number;
  teamName: string;
  managerName: string;
  points: number;
  opponentName: string;
  opponentManager: string;
  opponentPoints: number;
  won: boolean;
  margin: number;
  isPlayoffs: boolean;
  isConsolation: boolean;
}

interface SeasonStanding {
  season: number;
  teamName: string;
  managerName: string;
  rank: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
}

function parseTeam(teamData: any): { name: string; manager: string; points: number } {
  if (!teamData) return { name: "?", manager: "?", points: 0 };
  const info = Array.isArray(teamData) ? teamData[0] : teamData;
  const pts = Array.isArray(teamData) ? teamData[1]?.team_points : null;
  const infoArr = Array.isArray(info) ? info : [info];
  const flat: Record<string, any> = {};
  for (const item of infoArr) {
    if (typeof item === "object" && item !== null) Object.assign(flat, item);
  }
  return {
    name: flat.name || "?",
    manager: flat.managers?.[0]?.manager?.nickname || "?",
    points: parseFloat(pts?.total || "0"),
  };
}

async function fetchSeasonData(leagueKey: string, season: number): Promise<{
  scores: MatchupScore[];
  standings: SeasonStanding[];
  endWeek: number;
  playoffStart: number;
}> {
  console.log(`\n  Fetching ${season} season (${leagueKey})...`);

  // Get settings
  let endWeek = 16;
  let playoffStart = 14;
  try {
    const settingsRaw = await yahooGet(`/league/${leagueKey}/settings`);
    const league = dig(settingsRaw, "fantasy_content", "league");
    const meta = Array.isArray(league) ? league[0] : league;
    const settings = Array.isArray(league) ? league[1]?.settings?.[0] : {};
    endWeek = meta?.end_week || 16;
    playoffStart = settings?.playoff_start_week || meta?.playoff_start_week || 14;
    console.log(`    Settings: weeks 1-${endWeek}, playoffs week ${playoffStart}`);
  } catch (e: any) {
    console.log(`    Settings error (using defaults): ${e.message.slice(0, 80)}`);
  }

  await new Promise(r => setTimeout(r, 300));

  // Get standings
  const standings: SeasonStanding[] = [];
  try {
    const standingsRaw = await yahooGet(`/league/${leagueKey}/standings`);
    const stLeague = dig(standingsRaw, "fantasy_content", "league");
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
        season,
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
    console.log(`    Standings: ${standings.length} teams`);
  } catch (e: any) {
    console.log(`    Standings error: ${e.message.slice(0, 80)}`);
  }

  await new Promise(r => setTimeout(r, 300));

  // Fetch all scoreboards
  const scores: MatchupScore[] = [];
  for (let week = 1; week <= endWeek; week++) {
    try {
      const raw = await yahooGet(`/league/${leagueKey}/scoreboard;week=${week}`);
      const league = dig(raw, "fantasy_content", "league");
      const sbData = Array.isArray(league) ? league[1]?.scoreboard : null;
      const matchups = sbData?.[0]?.matchups || {};
      const count = matchups?.count || 0;

      let weekGames = 0;
      for (let i = 0; i < count; i++) {
        const m = matchups[i]?.matchup;
        if (!m) continue;
        const teams = m[0]?.teams || m?.teams || {};
        const isPlayoffs = m.is_playoffs === "1" || m.is_playoffs === true;
        const isConsolation = m.is_consolation === "1" || m.is_consolation === true;

        const t1 = parseTeam(teams[0]?.team);
        const t2 = parseTeam(teams[1]?.team);

        if (t1.points === 0 && t2.points === 0) continue;
        weekGames++;

        scores.push({
          season, week, isPlayoffs, isConsolation,
          teamName: t1.name, managerName: t1.manager, points: t1.points,
          opponentName: t2.name, opponentManager: t2.manager, opponentPoints: t2.points,
          won: t1.points > t2.points, margin: Math.abs(t1.points - t2.points),
        });
        scores.push({
          season, week, isPlayoffs, isConsolation,
          teamName: t2.name, managerName: t2.manager, points: t2.points,
          opponentName: t1.name, opponentManager: t1.manager, opponentPoints: t1.points,
          won: t2.points > t1.points, margin: Math.abs(t1.points - t2.points),
        });
      }

      if (weekGames === 0) {
        console.log(`    Week ${week}: no scores, stopping`);
        break;
      }

      process.stdout.write(`    Week ${week}: ${weekGames} games  \r`);
      await new Promise(r => setTimeout(r, 250));
    } catch {
      console.log(`    Week ${week}: error, stopping`);
      break;
    }
  }

  console.log(`    Total: ${scores.length / 2} matchups across ${new Set(scores.map(s => s.week)).size} weeks`);
  return { scores, standings, endWeek, playoffStart };
}

async function main() {
  console.log("Loading Yahoo tokens...");
  await getTokenViaProduction();
  console.log("Token acquired.\n");

  const allScores: MatchupScore[] = [];
  const allStandings: SeasonStanding[] = [];
  const seasonMeta: Record<number, { endWeek: number; playoffStart: number }> = {};

  for (const entry of LEAGUE_KEYS) {
    try {
      const data = await fetchSeasonData(entry.key, entry.season);
      allScores.push(...data.scores);
      allStandings.push(...data.standings);
      seasonMeta[entry.season] = { endWeek: data.endWeek, playoffStart: data.playoffStart };
    } catch (e: any) {
      console.log(`  FAILED for ${entry.season}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  // Compute records
  console.log("\n\nComputing all-time records...");
  console.log("=".repeat(50));

  const regSeasonScores = allScores.filter(s => !s.isPlayoffs);

  // Highest single-week score
  const highWeek = regSeasonScores.reduce((best, s) => s.points > best.points ? s : best, regSeasonScores[0]);

  // Lowest single-week score
  const lowWeek = regSeasonScores.filter(s => s.points > 0).reduce((worst, s) => s.points < worst.points ? s : worst, regSeasonScores[0]);

  // Biggest blowout
  const blowout = regSeasonScores.reduce((best, s) => s.margin > best.margin ? s : best, regSeasonScores[0]);

  // Closest game
  const closest = regSeasonScores.filter(s => s.margin > 0).reduce((best, s) => s.margin < best.margin ? s : best, regSeasonScores[0]);

  // Most points in a season (regular season only)
  const seasonTotals: Record<string, { manager: string; team: string; season: number; total: number }> = {};
  for (const s of regSeasonScores) {
    const key = `${s.season}-${s.managerName}`;
    if (!seasonTotals[key]) seasonTotals[key] = { manager: s.managerName, team: s.teamName, season: s.season, total: 0 };
    seasonTotals[key].total += s.points;
  }
  const bestSeason = Object.values(seasonTotals).reduce((best, s) => s.total > best.total ? s : best);
  const worstSeason = Object.values(seasonTotals).reduce((worst, s) => s.total < worst.total ? s : worst);

  // Best/worst regular season record
  const bestRecord = allStandings.reduce((best, s) => {
    const pct = s.wins / (s.wins + s.losses + s.ties || 1);
    const bestPct = best.wins / (best.wins + best.losses + best.ties || 1);
    return pct > bestPct ? s : best;
  });
  const worstRecord = allStandings.reduce((worst, s) => {
    const pct = s.wins / (s.wins + s.losses + s.ties || 1);
    const worstPct = worst.wins / (worst.wins + worst.losses + worst.ties || 1);
    return pct < worstPct ? s : worst;
  });

  // Win/loss streaks per manager per season
  const mgrSeasonGames: Record<string, MatchupScore[]> = {};
  for (const s of regSeasonScores) {
    const key = `${s.season}-${s.managerName}`;
    if (!mgrSeasonGames[key]) mgrSeasonGames[key] = [];
    mgrSeasonGames[key].push(s);
  }

  let longestWinStreak = { streak: 0, manager: "", season: 0 };
  let longestLossStreak = { streak: 0, manager: "", season: 0 };

  for (const [, games] of Object.entries(mgrSeasonGames)) {
    const sorted = [...games].sort((a, b) => a.week - b.week);
    let winStreak = 0, lossStreak = 0;
    for (const g of sorted) {
      if (g.won) {
        winStreak++;
        lossStreak = 0;
        if (winStreak > longestWinStreak.streak) {
          longestWinStreak = { streak: winStreak, manager: g.managerName, season: g.season };
        }
      } else {
        lossStreak++;
        winStreak = 0;
        if (lossStreak > longestLossStreak.streak) {
          longestLossStreak = { streak: lossStreak, manager: g.managerName, season: g.season };
        }
      }
    }
  }

  // Top 10 single-week scores
  const top10Weeks = [...regSeasonScores].sort((a, b) => b.points - a.points).slice(0, 10);
  const bottom10Weeks = [...regSeasonScores].filter(s => s.points > 0).sort((a, b) => a.points - b.points).slice(0, 10);
  const top10Blowouts = [...regSeasonScores].sort((a, b) => b.margin - a.margin)
    .filter((s, i, arr) => i === arr.findIndex(x => x.season === s.season && x.week === s.week && x.margin === s.margin))
    .slice(0, 10);
  const top10Closest = [...regSeasonScores].filter(s => s.margin > 0)
    .sort((a, b) => a.margin - b.margin)
    .filter((s, i, arr) => i === arr.findIndex(x => x.season === s.season && x.week === s.week && x.margin === s.margin))
    .slice(0, 10);

  // Season leaderboards
  const seasonPointsLeaders = Object.values(seasonTotals).sort((a, b) => b.total - a.total).slice(0, 10);

  const records = {
    fetchedAt: new Date().toISOString(),
    seasonsIncluded: Object.keys(seasonMeta).map(Number).sort(),
    totalMatchups: allScores.length / 2,
    totalSeasonEntries: allStandings.length,

    allTime: {
      mostPointsSeason: {
        holder: bestSeason.manager,
        team: bestSeason.team,
        value: Math.round(bestSeason.total * 100) / 100,
        season: bestSeason.season,
        description: "Most total points scored in a single regular season",
      },
      leastPointsSeason: {
        holder: worstSeason.manager,
        team: worstSeason.team,
        value: Math.round(worstSeason.total * 100) / 100,
        season: worstSeason.season,
        description: "Fewest total points scored in a single regular season",
      },
      mostPointsWeek: {
        holder: highWeek.managerName,
        team: highWeek.teamName,
        value: highWeek.points,
        week: highWeek.week,
        season: highWeek.season,
        opponent: highWeek.opponentName,
        description: "Highest single-week score in league history",
      },
      fewestPointsWeek: {
        holder: lowWeek.managerName,
        team: lowWeek.teamName,
        value: lowWeek.points,
        week: lowWeek.week,
        season: lowWeek.season,
        opponent: lowWeek.opponentName,
        description: "Lowest single-week score in league history",
      },
      longestWinStreak: {
        holder: longestWinStreak.manager,
        value: longestWinStreak.streak,
        season: longestWinStreak.season,
        description: "Most consecutive regular-season wins",
      },
      longestLosingStreak: {
        holder: longestLossStreak.manager,
        value: longestLossStreak.streak,
        season: longestLossStreak.season,
        description: "Most consecutive regular-season losses",
      },
      bestRecord: {
        holder: bestRecord.managerName,
        team: bestRecord.teamName,
        value: `${bestRecord.wins}-${bestRecord.losses}${bestRecord.ties ? `-${bestRecord.ties}` : ""}`,
        season: bestRecord.season,
        pointsFor: bestRecord.pointsFor,
        description: "Best regular-season record",
      },
      worstRecord: {
        holder: worstRecord.managerName,
        team: worstRecord.teamName,
        value: `${worstRecord.wins}-${worstRecord.losses}${worstRecord.ties ? `-${worstRecord.ties}` : ""}`,
        season: worstRecord.season,
        pointsFor: worstRecord.pointsFor,
        description: "Worst regular-season record",
      },
      biggestBlowout: {
        winner: blowout.managerName,
        winnerTeam: blowout.teamName,
        loser: blowout.opponentManager,
        loserTeam: blowout.opponentName,
        margin: Math.round(blowout.margin * 100) / 100,
        score: `${blowout.points}-${blowout.opponentPoints}`,
        week: blowout.week,
        season: blowout.season,
        description: "Largest margin of victory in a single matchup",
      },
      closestGame: {
        winner: closest.won ? closest.managerName : closest.opponentManager,
        winnerTeam: closest.won ? closest.teamName : closest.opponentName,
        loser: closest.won ? closest.opponentManager : closest.managerName,
        loserTeam: closest.won ? closest.opponentName : closest.teamName,
        margin: Math.round(closest.margin * 100) / 100,
        score: closest.won
          ? `${closest.points}-${closest.opponentPoints}`
          : `${closest.opponentPoints}-${closest.points}`,
        week: closest.week,
        season: closest.season,
        description: "Smallest margin of victory in a single matchup",
      },
    },

    leaderboards: {
      top10WeeklyScores: top10Weeks.map(s => ({
        manager: s.managerName, team: s.teamName, points: s.points,
        week: s.week, season: s.season, opponent: s.opponentName,
      })),
      bottom10WeeklyScores: bottom10Weeks.map(s => ({
        manager: s.managerName, team: s.teamName, points: s.points,
        week: s.week, season: s.season, opponent: s.opponentName,
      })),
      top10Blowouts: top10Blowouts.map(s => ({
        winner: s.won ? s.managerName : s.opponentManager,
        loser: s.won ? s.opponentManager : s.managerName,
        margin: Math.round(s.margin * 100) / 100,
        score: s.won ? `${s.points}-${s.opponentPoints}` : `${s.opponentPoints}-${s.points}`,
        week: s.week, season: s.season,
      })),
      top10ClosestGames: top10Closest.map(s => ({
        winner: s.won ? s.managerName : s.opponentManager,
        loser: s.won ? s.opponentManager : s.managerName,
        margin: Math.round(s.margin * 100) / 100,
        score: s.won ? `${s.points}-${s.opponentPoints}` : `${s.opponentPoints}-${s.points}`,
        week: s.week, season: s.season,
      })),
      topSeasonPointTotals: seasonPointsLeaders.map(s => ({
        manager: s.manager, team: s.team, points: Math.round(s.total * 100) / 100, season: s.season,
      })),
    },

    seasonStandings: allStandings,
    seasonMeta,
  };

  // Print summary
  console.log(`\nHighest week: ${highWeek.points} by ${highWeek.managerName} (${highWeek.teamName}) - Week ${highWeek.week}, ${highWeek.season}`);
  console.log(`Lowest week: ${lowWeek.points} by ${lowWeek.managerName} (${lowWeek.teamName}) - Week ${lowWeek.week}, ${lowWeek.season}`);
  console.log(`Biggest blowout: ${blowout.margin.toFixed(1)} pts - ${blowout.managerName} over ${blowout.opponentManager}, Week ${blowout.week}, ${blowout.season}`);
  console.log(`Closest game: ${closest.margin.toFixed(2)} pts - Week ${closest.week}, ${closest.season}`);
  console.log(`Best record: ${bestRecord.managerName} (${bestRecord.wins}-${bestRecord.losses}) in ${bestRecord.season}`);
  console.log(`Worst record: ${worstRecord.managerName} (${worstRecord.wins}-${worstRecord.losses}) in ${worstRecord.season}`);
  console.log(`Best season: ${bestSeason.manager} with ${bestSeason.total.toFixed(1)} pts in ${bestSeason.season}`);
  console.log(`Longest win streak: ${longestWinStreak.streak} by ${longestWinStreak.manager} in ${longestWinStreak.season}`);
  console.log(`Longest loss streak: ${longestLossStreak.streak} by ${longestLossStreak.manager} in ${longestLossStreak.season}`);

  // Save to file
  const outPath = resolve(import.meta.dirname || __dirname, "../src/data/all-time-records.json");
  writeFileSync(outPath, JSON.stringify(records, null, 2));
  console.log(`\nSaved to ${outPath}`);
}

main().catch(console.error);
