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

function lower(err: unknown): string {
  return (err instanceof Error ? err.message : String(err)).toLowerCase();
}

/**
 * Yahoo accepted the request, identified the app, and refused it.
 *
 * Yahoo's own wording for this is "This application is not authorized to
 * perform this action", which it returns with a 403 even for reading your own
 * profile. Newly provisioned apps get a 401 `additional_authorization_required`
 * for the same underlying reason.
 */
function isAccessDeniedError(err: unknown): boolean {
  const msg = lower(err);
  return (
    msg.includes("not authorized to perform this action") ||
    msg.includes("additional_authorization_required") ||
    msg.includes("invalid_scope") ||
    msg.includes("token_rejected") ||
    msg.includes(": 403") ||
    msg.includes("(403)")
  );
}

function isConfigError(err: unknown): boolean {
  if (isAccessDeniedError(err)) return false;
  const msg = lower(err);
  return (
    msg.includes("yahoo_client_id") ||
    msg.includes("yahoo_client_secret") ||
    msg.includes("no yahoo tokens") ||
    msg.includes("not configured")
  );
}

/**
 * Only ever true when Yahoo has not refused us. Failing to resolve the game key
 * looks like "no season yet" on its own, but the same failure carrying a 403 is
 * a lockout, and rendering that as a kickoff countdown told readers the season
 * had not started while it was in week two.
 */
function isOffseasonError(err: unknown): boolean {
  if (isAccessDeniedError(err)) return false;
  const msg = lower(err);
  return (
    msg.includes("(400)") ||
    msg.includes("temporary problem") ||
    msg.includes("failed to resolve nfl game key") ||
    msg.includes("invalid league") ||
    msg.includes("invalid game")
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
      accessDenied: isAccessDeniedError(err),
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
