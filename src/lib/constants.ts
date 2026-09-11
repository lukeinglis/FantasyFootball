// League configuration
export const YAHOO_LEAGUE_ID =
  process.env.YAHOO_LEAGUE_ID || "655705";

// Game key — changes each NFL season
// Set to "nfl" to auto-discover, or hardcode (e.g., "449" for 2025)
export const YAHOO_GAME_KEY =
  process.env.YAHOO_GAME_KEY || "nfl";

// Derived league key: "{game_key}.l.{league_id}"
// Built dynamically after resolving the game key
export function buildLeagueKey(resolvedGameKey: string): string {
  return `${resolvedGameKey}.l.${YAHOO_LEAGUE_ID}`;
}

// Cache TTLs in seconds
export const CACHE_TTL = {
  STANDINGS: 15 * 60, // 15 minutes
  SCOREBOARD: 5 * 60, // 5 minutes (during games)
  SCOREBOARD_IDLE: 60 * 60, // 1 hour (no games)
  ROSTERS: 30 * 60, // 30 minutes
  DRAFT: 24 * 60 * 60, // 24 hours (static after draft)
  TRANSACTIONS: 15 * 60, // 15 minutes
  SETTINGS: 24 * 60 * 60, // 24 hours
  MATCHUPS: 15 * 60, // 15 minutes
  TEAMS: 30 * 60, // 30 minutes
} as const;

/**
 * Payout structure, confirmed by the commissioner.
 *
 * $250 a head across 12 managers makes a $3,000 pot. $100 goes out each week
 * for 14 weeks ($1,400), leaving $1,600 for the end of the year.
 *
 * How that $1,600 splits across first, second and third is not recorded
 * anywhere in the export, so it is deliberately null rather than guessed;
 * callers should say the split is unrecorded instead of printing a number.
 *
 * This is the single source of truth for money. `src/data/payouts.json`
 * mirrors these figures but is only read for the weekly payout ledger.
 */
export const PAYOUTS = {
  buyIn: 250,
  teams: 12,
  totalPot: 3000,
  weeklyPerWeek: 100,
  weeklyWeeks: 14,
  weeklyPool: 1400,
  yearEndPool: 1600,
  first: null,
  second: null,
  third: null,
} as const;
