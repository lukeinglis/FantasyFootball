import type { FetchResult } from "./fetcher";
import {
  getLeagueSettings,
  getStandings,
  getScoreboard,
  getTeams,
  getTeamRoster,
  getTeamMatchups,
  getDraftResults,
  getTransactions,
  isFallbackSeason,
} from "./yahoo/client";
import type {
  LeagueSettings,
  LeagueStandings,
  Scoreboard,
  Team,
  Roster,
  Matchup,
  DraftResult,
  Transaction,
} from "./yahoo/types";
import logger from "./logger";

function isConfigError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes("yahoo_client_id") ||
    lower.includes("yahoo_client_secret") ||
    lower.includes("no yahoo tokens") ||
    lower.includes("not configured")
  );
}

function isOffseasonError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes("(400)") ||
    lower.includes("temporary problem") ||
    lower.includes("failed to resolve nfl game key") ||
    lower.includes("invalid league") ||
    lower.includes("invalid game")
  );
}

async function safeFetch<T>(fn: () => Promise<T>, resource: string): Promise<FetchResult<T>> {
  logger.debug({ module: "server-data", resource }, "safeFetch called");
  try {
    const data = await fn();
    logger.debug({ module: "server-data", resource }, "safeFetch succeeded");
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error({ module: "server-data", resource, err }, "safeFetch failed");
    return {
      ok: false,
      status: 0,
      message,
      notConfigured: isConfigError(err),
      offseason: isOffseasonError(err),
    };
  }
}

export function fetchSettings(): Promise<FetchResult<LeagueSettings>> {
  return safeFetch(() => getLeagueSettings(), "settings");
}

export function fetchStandings(): Promise<FetchResult<LeagueStandings>> {
  return safeFetch(() => getStandings(), "standings");
}

export function fetchScoreboard(week?: number): Promise<FetchResult<Scoreboard>> {
  return safeFetch(() => getScoreboard(week), "scoreboard");
}

export function fetchTeams(): Promise<FetchResult<Team[]>> {
  return safeFetch(() => getTeams(), "teams");
}

export function fetchRoster(teamKey: string, week?: number): Promise<FetchResult<Roster>> {
  return safeFetch(() => getTeamRoster(teamKey, week), "roster");
}

export function fetchTeamMatchups(teamKey: string): Promise<FetchResult<Matchup[]>> {
  return safeFetch(() => getTeamMatchups(teamKey), "matchups");
}

export function fetchDraft(): Promise<FetchResult<DraftResult[]>> {
  return safeFetch(() => getDraftResults(), "draft");
}

export function fetchTransactions(): Promise<FetchResult<Transaction[]>> {
  return safeFetch(() => getTransactions(), "transactions");
}

export function isViewingFallbackSeason(): boolean {
  return isFallbackSeason();
}
