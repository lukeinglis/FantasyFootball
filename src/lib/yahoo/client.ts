import { getValidToken } from "./auth";
import { cache } from "@/lib/cache";
import { YAHOO_LEAGUE_ID, YAHOO_GAME_KEY, CACHE_TTL } from "@/lib/constants";
import type {
  LeagueSettings,
  LeagueStandings,
  StandingsTeam,
  Scoreboard,
  Matchup,
  MatchupTeam,
  Team,
  Roster,
  RosterPlayer,
  DraftResult,
  Transaction,
  TransactionPlayer,
} from "./types";

// ============================================================
// Yahoo Fantasy Sports API Client
//
// Wraps direct API calls with caching and error handling.
// Uses Yahoo's REST API with JSON responses.
// ============================================================

const YAHOO_API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

// --- Core Fetch ---

async function yahooFetch<T>(
  path: string,
  cacheKey: string,
  ttl: number
): Promise<T> {
  // Check cache first
  const cached = await cache.get<T>(cacheKey);
  if (cached) return cached;

  try {
    const token = await getValidToken();
    const url = `${YAHOO_API_BASE}${path}${path.includes("?") ? "&" : "?"}format=json`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Handle Yahoo rate limiting (non-standard HTTP 999)
    if (response.status === 999) {
      console.warn(`Yahoo API rate limited on: ${path}`);
      const stale = await cache.getStale<T>(cacheKey);
      if (stale) {
        console.warn("Returning stale cached data");
        return stale;
      }
      throw new Error("Yahoo API rate limited and no cached data available");
    }

    if (!response.ok) {
      throw new Error(`Yahoo API error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    const parsed = data as T;

    // Cache the result
    await cache.set(cacheKey, parsed, ttl);
    return parsed;
  } catch (error) {
    // On any fetch error, try returning stale data
    const stale = await cache.getStale<T>(cacheKey);
    if (stale) {
      console.warn(`Yahoo API error, returning stale cache for: ${cacheKey}`, error);
      return stale;
    }
    throw error;
  }
}

// --- Game Key Resolution ---

let _resolvedGameKey: string | null = null;

async function getGameKey(): Promise<string> {
  if (_resolvedGameKey) return _resolvedGameKey;

  // If a numeric game key is configured, use it directly
  if (YAHOO_GAME_KEY && /^\d+$/.test(YAHOO_GAME_KEY)) {
    _resolvedGameKey = YAHOO_GAME_KEY;
    return _resolvedGameKey;
  }

  // Otherwise resolve "nfl" to the current season's game key
  const token = await getValidToken();
  const url = `${YAHOO_API_BASE}/game/nfl?format=json`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve NFL game key: ${response.status}`);
  }

  const data = await response.json();
  const gameKey = data?.fantasy_content?.game?.[0]?.game_key;
  if (!gameKey) {
    throw new Error("Could not extract game key from Yahoo API response");
  }

  _resolvedGameKey = gameKey;
  return gameKey;
}

async function getLeagueKey(): Promise<string> {
  const gameKey = await getGameKey();
  return `${gameKey}.l.${YAHOO_LEAGUE_ID}`;
}

// ============================================================
// Public API Methods
// ============================================================

/**
 * Get league settings (scoring, roster positions, etc.)
 */
export async function getLeagueSettings(): Promise<LeagueSettings> {
  const leagueKey = await getLeagueKey();
  const raw = await yahooFetch<Record<string, unknown>>(
    `/league/${leagueKey}/settings`,
    `yahoo:settings:${leagueKey}`,
    CACHE_TTL.SETTINGS
  );
  return parseLeagueSettings(raw);
}

/**
 * Get current league standings
 */
export async function getStandings(): Promise<LeagueStandings> {
  const leagueKey = await getLeagueKey();
  const raw = await yahooFetch<Record<string, unknown>>(
    `/league/${leagueKey}/standings`,
    `yahoo:standings:${leagueKey}`,
    CACHE_TTL.STANDINGS
  );
  return parseStandings(raw, leagueKey);
}

/**
 * Get scoreboard for a specific week (or current week if omitted)
 */
export async function getScoreboard(week?: number): Promise<Scoreboard> {
  const leagueKey = await getLeagueKey();
  const weekParam = week ? `;week=${week}` : "";
  const raw = await yahooFetch<Record<string, unknown>>(
    `/league/${leagueKey}/scoreboard${weekParam}`,
    `yahoo:scoreboard:${leagueKey}:${week || "current"}`,
    CACHE_TTL.SCOREBOARD
  );
  return parseScoreboard(raw, leagueKey);
}

/**
 * Get all teams in the league
 */
export async function getTeams(): Promise<Team[]> {
  const leagueKey = await getLeagueKey();
  const raw = await yahooFetch<Record<string, unknown>>(
    `/league/${leagueKey}/teams`,
    `yahoo:teams:${leagueKey}`,
    CACHE_TTL.TEAMS
  );
  return parseTeams(raw);
}

/**
 * Get a team's roster for a specific week
 */
export async function getTeamRoster(
  teamKey: string,
  week?: number
): Promise<Roster> {
  const weekParam = week ? `;week=${week}` : "";
  const raw = await yahooFetch<Record<string, unknown>>(
    `/team/${teamKey}/roster${weekParam}`,
    `yahoo:roster:${teamKey}:${week || "current"}`,
    CACHE_TTL.ROSTERS
  );
  return parseRoster(raw, teamKey);
}

/**
 * Get a team's matchups for the season
 */
export async function getTeamMatchups(teamKey: string): Promise<Matchup[]> {
  const raw = await yahooFetch<Record<string, unknown>>(
    `/team/${teamKey}/matchups`,
    `yahoo:matchups:${teamKey}`,
    CACHE_TTL.MATCHUPS
  );
  return parseTeamMatchups(raw);
}

/**
 * Get draft results with player details.
 * Uses the /players subresource to fetch player name, position, and NFL team
 * in the same call (avoids N+1 lookups).
 */
export async function getDraftResults(): Promise<DraftResult[]> {
  const leagueKey = await getLeagueKey();

  // First, try to get draft results with player details in a single call.
  // The ;players subresource tells Yahoo to embed player info with each pick.
  try {
    const raw = await yahooFetch<Record<string, unknown>>(
      `/league/${leagueKey}/draftresults;out=players`,
      `yahoo:draft_full:${leagueKey}`,
      CACHE_TTL.DRAFT
    );
    const results = parseDraftResults(raw);

    // If player names are populated, return as-is
    if (results.length > 0 && results[0].playerName) {
      return results;
    }
  } catch {
    // Fall through to enrichment strategy
  }

  // Fallback: fetch draft results and teams separately, then enrich
  // with a bulk player lookup
  const [raw, teams] = await Promise.all([
    yahooFetch<Record<string, unknown>>(
      `/league/${leagueKey}/draftresults`,
      `yahoo:draft:${leagueKey}`,
      CACHE_TTL.DRAFT
    ),
    getTeams().catch(() => [] as Team[]),
  ]);

  const results = parseDraftResults(raw);

  // Build team lookup for enrichment
  const teamMap = new Map(teams.map((t) => [t.teamKey, t]));
  for (const pick of results) {
    const team = teamMap.get(pick.teamKey);
    if (team) {
      pick.teamName = team.teamName;
      pick.managerName = team.managerName;
    }
  }

  // Attempt to fetch player details for all drafted players
  const playerKeys = results.map((r) => r.playerKey).filter(Boolean);
  if (playerKeys.length > 0) {
    try {
      const playerMap = await fetchPlayerDetails(playerKeys);
      for (const pick of results) {
        const player = playerMap.get(pick.playerKey);
        if (player) {
          pick.playerName = player.name;
          pick.position = player.position;
          pick.nflTeam = player.nflTeam;
          pick.playerId = player.playerId;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch player details for draft:", e);
    }
  }

  return results;
}

/**
 * Get transactions (adds, drops, trades)
 */
export async function getTransactions(): Promise<Transaction[]> {
  const leagueKey = await getLeagueKey();
  const raw = await yahooFetch<Record<string, unknown>>(
    `/league/${leagueKey}/transactions`,
    `yahoo:transactions:${leagueKey}`,
    CACHE_TTL.TRANSACTIONS
  );
  return parseTransactions(raw);
}

// ============================================================
// Player Detail Fetcher
//
// Fetches player metadata (name, position, NFL team) in batches.
// Yahoo limits player lookups to ~25 keys per request.
// ============================================================

interface PlayerInfo {
  playerKey: string;
  playerId: number;
  name: string;
  position: string;
  nflTeam: string;
}

async function fetchPlayerDetails(
  playerKeys: string[]
): Promise<Map<string, PlayerInfo>> {
  const result = new Map<string, PlayerInfo>();
  const gameKey = await getGameKey();

  // Yahoo allows comma-separated player keys, but limit batch size
  const BATCH_SIZE = 25;
  for (let i = 0; i < playerKeys.length; i += BATCH_SIZE) {
    const batch = playerKeys.slice(i, i + BATCH_SIZE);
    const keysParam = batch.join(",");

    try {
      const raw = await yahooFetch<Record<string, unknown>>(
        `/players;player_keys=${keysParam}`,
        `yahoo:players:${gameKey}:${i}`,
        CACHE_TTL.DRAFT
      );
      const players = parsePlayerBatch(raw);
      for (const p of players) {
        result.set(p.playerKey, p);
      }
    } catch (e) {
      console.warn(`Failed to fetch player batch ${i}:`, e);
    }
  }

  return result;
}

// ============================================================
// Response Parsers
//
// Yahoo's JSON responses are deeply nested and inconsistent.
// These parsers normalize the data into our clean types.
// The exact structure may vary — these are best-effort based
// on the documented API and common response shapes.
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

function dig(obj: any, ...keys: string[]): any {
  let current = obj;
  for (const key of keys) {
    if (current == null) return undefined;
    current = current[key];
  }
  return current;
}

function parseLeagueSettings(raw: any): LeagueSettings {
  const league = dig(raw, "fantasy_content", "league");
  // Yahoo returns league as an array: [metadata, {settings}]
  const meta = Array.isArray(league) ? league[0] : league;
  const settingsObj = Array.isArray(league)
    ? league[1]?.settings?.[0] || {}
    : league?.settings?.[0] || {};

  return {
    leagueKey: meta?.league_key || "",
    leagueId: meta?.league_id || 0,
    name: meta?.name || "",
    season: meta?.season || "",
    numTeams: meta?.num_teams || 0,
    scoringType: meta?.scoring_type || "",
    currentWeek: meta?.current_week || 1,
    startWeek: meta?.start_week || 1,
    endWeek: meta?.end_week || 17,
    playoffStartWeek: meta?.playoff_start_week || settingsObj?.playoff_start_week || 15,
    numPlayoffTeams: meta?.num_playoff_teams || settingsObj?.num_playoff_teams || 6,
    isFinished: meta?.is_finished === 1 || meta?.is_finished === true,
    rosterPositions: (settingsObj?.roster_positions || []).map((rp: any) => ({
      position: rp?.roster_position?.position || "",
      positionType: rp?.roster_position?.position_type || "",
      count: rp?.roster_position?.count || 1,
    })),
    statCategories: (settingsObj?.stat_categories?.stats || []).map(
      (s: any) => ({
        statId: s?.stat?.stat_id || 0,
        name: s?.stat?.name || "",
        displayName: s?.stat?.display_name || "",
        positionType: s?.stat?.position_type || "",
      })
    ),
  };
}

function parseStandings(raw: any, leagueKey: string): LeagueStandings {
  const league = dig(raw, "fantasy_content", "league");
  const meta = Array.isArray(league) ? league[0] : league;
  const standingsData = Array.isArray(league) ? league[1]?.standings : null;
  const teamsArray = standingsData?.[0]?.teams || {};

  const teams: StandingsTeam[] = [];
  const count = teamsArray?.count || 0;

  for (let i = 0; i < count; i++) {
    const teamData = teamsArray[i]?.team;
    if (!teamData) continue;

    const info = Array.isArray(teamData) ? teamData[0] : teamData;
    const standings = Array.isArray(teamData) ? teamData[1]?.team_standings : null;
    const infoArray = Array.isArray(info) ? info : [info];

    // Yahoo stuffs team metadata into a flat array of objects
    const flat: Record<string, any> = {};
    for (const item of infoArray) {
      if (typeof item === "object" && item !== null) {
        Object.assign(flat, item);
      }
    }

    teams.push({
      teamKey: flat.team_key || "",
      teamId: flat.team_id || 0,
      teamName: flat.name || "",
      managerName: flat.managers?.[0]?.manager?.nickname || "",
      managerId: flat.managers?.[0]?.manager?.manager_id || "",
      logoUrl: flat.team_logos?.[0]?.team_logo?.url || null,
      rank: standings?.rank || 0,
      wins: standings?.outcome_totals?.wins || 0,
      losses: standings?.outcome_totals?.losses || 0,
      ties: standings?.outcome_totals?.ties || 0,
      percentage: parseFloat(standings?.outcome_totals?.percentage || "0"),
      pointsFor: parseFloat(standings?.points_for || "0"),
      pointsAgainst: parseFloat(standings?.points_against || "0"),
      streak: standings?.streak?.type
        ? `${standings.streak.type}${standings.streak.value}`
        : "",
      playoffSeed: standings?.playoff_seed || null,
    });
  }

  return {
    leagueKey,
    leagueName: meta?.name || "",
    season: meta?.season || "",
    teams: teams.sort((a, b) => a.rank - b.rank),
  };
}

function parseScoreboard(raw: any, leagueKey: string): Scoreboard {
  const league = dig(raw, "fantasy_content", "league");
  const scoreboardData = Array.isArray(league) ? league[1]?.scoreboard : null;
  const week = scoreboardData?.week || 1;
  const matchupsData = scoreboardData?.[0]?.matchups || {};

  const matchups: Matchup[] = [];
  const count = matchupsData?.count || 0;

  for (let i = 0; i < count; i++) {
    const m = matchupsData[i]?.matchup;
    if (!m) continue;

    const teamsData = m[0]?.teams || m?.teams || {};
    const team1 = parseMatchupTeam(teamsData[0]?.team);
    const team2 = parseMatchupTeam(teamsData[1]?.team);

    matchups.push({
      matchupId: i,
      week: m.week || week,
      status: m.status || "pregame",
      isPlayoffs: m.is_playoffs === "1" || m.is_playoffs === true,
      isConsolation: m.is_consolation === "1" || m.is_consolation === true,
      teams: [team1, team2],
      winnerTeamKey: m.winner_team_key || null,
    });
  }

  return { leagueKey, week, matchups };
}

function parseMatchupTeam(teamData: any): MatchupTeam {
  if (!teamData) {
    return {
      teamKey: "",
      teamId: 0,
      teamName: "",
      managerName: "",
      points: 0,
      projectedPoints: 0,
    };
  }

  const info = Array.isArray(teamData) ? teamData[0] : teamData;
  const points = Array.isArray(teamData) ? teamData[1]?.team_points : null;
  const projected = Array.isArray(teamData)
    ? teamData[1]?.team_projected_points
    : null;

  const infoArray = Array.isArray(info) ? info : [info];
  const flat: Record<string, any> = {};
  for (const item of infoArray) {
    if (typeof item === "object" && item !== null) {
      Object.assign(flat, item);
    }
  }

  return {
    teamKey: flat.team_key || "",
    teamId: flat.team_id || 0,
    teamName: flat.name || "",
    managerName: flat.managers?.[0]?.manager?.nickname || "",
    points: parseFloat(points?.total || "0"),
    projectedPoints: parseFloat(projected?.total || "0"),
  };
}

function parseTeams(raw: any): Team[] {
  const league = dig(raw, "fantasy_content", "league");
  const teamsData = Array.isArray(league) ? league[1]?.teams : {};
  const count = teamsData?.count || 0;
  const teams: Team[] = [];

  for (let i = 0; i < count; i++) {
    const teamData = teamsData[i]?.team;
    if (!teamData) continue;

    const info = Array.isArray(teamData) ? teamData[0] : teamData;
    const standings = Array.isArray(teamData)
      ? teamData[1]?.team_standings
      : null;

    const infoArray = Array.isArray(info) ? info : [info];
    const flat: Record<string, any> = {};
    for (const item of infoArray) {
      if (typeof item === "object" && item !== null) {
        Object.assign(flat, item);
      }
    }

    teams.push({
      teamKey: flat.team_key || "",
      teamId: flat.team_id || 0,
      teamName: flat.name || "",
      managerName: flat.managers?.[0]?.manager?.nickname || "",
      managerId: flat.managers?.[0]?.manager?.manager_id || "",
      logoUrl: flat.team_logos?.[0]?.team_logo?.url || null,
      waiverPriority: flat.waiver_priority || 0,
      faabBalance: flat.faab_balance != null ? Number(flat.faab_balance) : null,
      wins: standings?.outcome_totals?.wins || 0,
      losses: standings?.outcome_totals?.losses || 0,
      ties: standings?.outcome_totals?.ties || 0,
      pointsFor: parseFloat(standings?.points_for || "0"),
      pointsAgainst: parseFloat(standings?.points_against || "0"),
    });
  }

  return teams;
}

function parseRoster(raw: any, teamKey: string): Roster {
  const team = dig(raw, "fantasy_content", "team");
  const meta = Array.isArray(team) ? team[0] : team;
  const rosterData = Array.isArray(team) ? team[1]?.roster : null;
  const playersData = rosterData?.[0]?.players || {};
  const count = playersData?.count || 0;

  const infoArray = Array.isArray(meta) ? meta : [meta];
  const flat: Record<string, any> = {};
  for (const item of infoArray || []) {
    if (typeof item === "object" && item !== null) {
      Object.assign(flat, item);
    }
  }

  const players: RosterPlayer[] = [];
  for (let i = 0; i < count; i++) {
    const playerData = playersData[i]?.player;
    if (!playerData) continue;

    const pInfo = Array.isArray(playerData) ? playerData[0] : playerData;
    const selectedPos = Array.isArray(playerData)
      ? playerData[1]?.selected_position?.[1]?.position
      : null;

    const pInfoArray = Array.isArray(pInfo) ? pInfo : [pInfo];
    const pFlat: Record<string, any> = {};
    for (const item of pInfoArray) {
      if (typeof item === "object" && item !== null) {
        Object.assign(pFlat, item);
      }
    }

    players.push({
      playerKey: pFlat.player_key || "",
      playerId: pFlat.player_id || 0,
      playerName: pFlat.name?.full || "",
      position: pFlat.display_position || "",
      eligiblePositions: (pFlat.eligible_positions || []).map(
        (ep: any) => ep?.position || ""
      ),
      selectedPosition: selectedPos || pFlat.display_position || "",
      nflTeam: pFlat.editorial_team_abbr || "",
      status: pFlat.status || null,
      imageUrl: pFlat.image_url || pFlat.headshot?.url || null,
      byeWeek: pFlat.bye_weeks?.week || 0,
      points: null,
      projectedPoints: null,
    });
  }

  return {
    teamKey,
    teamName: flat.name || "",
    week: rosterData?.week || 0,
    players,
  };
}

function parseTeamMatchups(raw: any): Matchup[] {
  const team = dig(raw, "fantasy_content", "team");
  const matchupsData = Array.isArray(team) ? team[1]?.matchups : {};
  const count = matchupsData?.count || 0;
  const matchups: Matchup[] = [];

  for (let i = 0; i < count; i++) {
    const m = matchupsData[i]?.matchup;
    if (!m) continue;

    const teamsData = m[0]?.teams || m?.teams || {};
    const team1 = parseMatchupTeam(teamsData[0]?.team);
    const team2 = parseMatchupTeam(teamsData[1]?.team);

    matchups.push({
      matchupId: i,
      week: m.week || i + 1,
      status: m.status || "pregame",
      isPlayoffs: m.is_playoffs === "1" || m.is_playoffs === true,
      isConsolation: m.is_consolation === "1" || m.is_consolation === true,
      teams: [team1, team2],
      winnerTeamKey: m.winner_team_key || null,
    });
  }

  return matchups;
}

function parseDraftResults(raw: any): DraftResult[] {
  const league = dig(raw, "fantasy_content", "league");
  const draftData = Array.isArray(league) ? league[1]?.draft_results : {};
  const count = draftData?.count || 0;
  const results: DraftResult[] = [];

  for (let i = 0; i < count; i++) {
    const pick = draftData[i]?.draft_result;
    if (!pick) continue;

    // Check for embedded player data (when using ;out=players subresource)
    let playerName = "";
    let position = "";
    let nflTeam = "";
    let playerId = 0;

    // Yahoo may embed player info in the draft_result when ;out=players is used
    const playerData = pick.players?.[0]?.player;
    if (playerData) {
      const pInfo = Array.isArray(playerData) ? playerData[0] : playerData;
      const pInfoArray = Array.isArray(pInfo) ? pInfo : [pInfo];
      const pFlat: Record<string, any> = {};
      for (const item of pInfoArray) {
        if (typeof item === "object" && item !== null) {
          Object.assign(pFlat, item);
        }
      }
      playerName = pFlat.name?.full || "";
      position = pFlat.display_position || "";
      nflTeam = pFlat.editorial_team_abbr || "";
      playerId = pFlat.player_id || 0;
    }

    results.push({
      pick: pick.pick || i + 1,
      round: pick.round || 0,
      teamKey: pick.team_key || "",
      teamName: "",
      managerName: "",
      playerKey: pick.player_key || "",
      playerId,
      playerName,
      position,
      nflTeam,
    });
  }

  return results;
}

function parsePlayerBatch(raw: any): PlayerInfo[] {
  const content = dig(raw, "fantasy_content");
  if (!content) return [];

  // Yahoo returns players in different structures depending on the query.
  // Try the common shapes.
  const playersRoot = content.players || content.league?.[1]?.players || {};
  const count = playersRoot?.count || 0;
  const results: PlayerInfo[] = [];

  for (let i = 0; i < count; i++) {
    const playerData = playersRoot[i]?.player;
    if (!playerData) continue;

    const pInfo = Array.isArray(playerData) ? playerData[0] : playerData;
    const pInfoArray = Array.isArray(pInfo) ? pInfo : [pInfo];
    const pFlat: Record<string, any> = {};
    for (const item of pInfoArray) {
      if (typeof item === "object" && item !== null) {
        Object.assign(pFlat, item);
      }
    }

    results.push({
      playerKey: pFlat.player_key || "",
      playerId: pFlat.player_id || 0,
      name: pFlat.name?.full || "",
      position: pFlat.display_position || "",
      nflTeam: pFlat.editorial_team_abbr || "",
    });
  }

  return results;
}

function parseTransactions(raw: any): Transaction[] {
  const league = dig(raw, "fantasy_content", "league");
  const txData = Array.isArray(league) ? league[1]?.transactions : {};
  const count = txData?.count || 0;
  const transactions: Transaction[] = [];

  for (let i = 0; i < count; i++) {
    const tx = txData[i]?.transaction;
    if (!tx) continue;

    const txMeta = Array.isArray(tx) ? tx[0] : tx;
    const playersData = Array.isArray(tx) ? tx[1]?.players : {};
    const playerCount = playersData?.count || 0;

    const players: TransactionPlayer[] = [];
    for (let j = 0; j < playerCount; j++) {
      const p = playersData[j]?.player;
      if (!p) continue;

      const pInfo = Array.isArray(p) ? p[0] : p;
      const txDetail = Array.isArray(p) ? p[1]?.transaction_data : null;
      const txDetailData = Array.isArray(txDetail) ? txDetail[0] : txDetail;

      const pInfoArray = Array.isArray(pInfo) ? pInfo : [pInfo];
      const pFlat: Record<string, any> = {};
      for (const item of pInfoArray) {
        if (typeof item === "object" && item !== null) {
          Object.assign(pFlat, item);
        }
      }

      players.push({
        playerKey: pFlat.player_key || "",
        playerName: pFlat.name?.full || "",
        position: pFlat.display_position || "",
        nflTeam: pFlat.editorial_team_abbr || "",
        transactionType: txDetailData?.type || "add",
        sourceType: txDetailData?.source_type || "",
        sourceTeamKey: txDetailData?.source_team_key || null,
        sourceTeamName: txDetailData?.source_team_name || null,
        destinationTeamKey: txDetailData?.destination_team_key || null,
        destinationTeamName: txDetailData?.destination_team_name || null,
      });
    }

    transactions.push({
      transactionKey: txMeta.transaction_key || "",
      transactionId: txMeta.transaction_id || 0,
      type: txMeta.type || "add",
      status: txMeta.status || "",
      timestamp: txMeta.timestamp ? Number(txMeta.timestamp) : 0,
      players,
    });
  }

  return transactions;
}

/* eslint-enable @typescript-eslint/no-explicit-any */
