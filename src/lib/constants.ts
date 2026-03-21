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

// Payout structure
export const PAYOUTS = {
  buyIn: 150,
  totalPot: 1350,
  first: 800,
  second: 340,
  third: 200,
} as const;
