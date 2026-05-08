// ============================================================
// Yahoo Fantasy Sports API — TypeScript Definitions
// ============================================================

// --- League ---

export interface LeagueSettings {
  leagueKey: string;
  leagueId: number;
  name: string;
  season: string;
  numTeams: number;
  scoringType: string;
  currentWeek: number;
  startWeek: number;
  endWeek: number;
  playoffStartWeek: number;
  numPlayoffTeams: number;
  isFinished: boolean;
  rosterPositions: RosterPosition[];
  statCategories: StatCategory[];
}

export interface RosterPosition {
  position: string;
  positionType: string;
  count: number;
}

export interface StatCategory {
  statId: number;
  name: string;
  displayName: string;
  positionType: string;
}

// --- Standings ---

export interface LeagueStandings {
  leagueKey: string;
  leagueName: string;
  season: string;
  teams: StandingsTeam[];
}

export interface StandingsTeam {
  teamKey: string;
  teamId: number;
  teamName: string;
  managerName: string;
  managerId: string;
  logoUrl: string | null;
  rank: number;
  wins: number;
  losses: number;
  ties: number;
  percentage: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: string;
  playoffSeed: number | null;
}

// --- Scoreboard / Matchups ---

export interface Scoreboard {
  leagueKey: string;
  week: number;
  matchups: Matchup[];
}

export interface Matchup {
  matchupId: number;
  week: number;
  status: "pregame" | "inprogress" | "postgame";
  isPlayoffs: boolean;
  isConsolation: boolean;
  teams: [MatchupTeam, MatchupTeam];
  winnerTeamKey: string | null;
}

export interface MatchupTeam {
  teamKey: string;
  teamId: number;
  teamName: string;
  managerName: string;
  points: number;
  projectedPoints: number;
}

// --- Teams / Rosters ---

export interface Team {
  teamKey: string;
  teamId: number;
  teamName: string;
  managerName: string;
  managerId: string;
  logoUrl: string | null;
  waiverPriority: number;
  faabBalance: number | null;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface Roster {
  teamKey: string;
  teamName: string;
  week: number;
  players: RosterPlayer[];
}

export interface RosterPlayer {
  playerKey: string;
  playerId: number;
  playerName: string;
  position: string;
  eligiblePositions: string[];
  selectedPosition: string;
  nflTeam: string;
  status: string | null; // "IR", "O", "Q", "D", etc.
  imageUrl: string | null;
  byeWeek: number;
  points: number | null;
  projectedPoints: number | null;
}

// --- Draft ---

export interface DraftResult {
  pick: number;
  round: number;
  teamKey: string;
  teamName: string;
  managerName: string;
  playerKey: string;
  playerId: number;
  playerName: string;
  position: string;
  nflTeam: string;
}

// --- Transactions ---

export type TransactionType = "add" | "drop" | "add/drop" | "trade";

export interface Transaction {
  transactionKey: string;
  transactionId: number;
  type: TransactionType;
  status: string;
  timestamp: number; // Unix timestamp
  players: TransactionPlayer[];
}

export interface TransactionPlayer {
  playerKey: string;
  playerName: string;
  position: string;
  nflTeam: string;
  transactionType: "add" | "drop";
  sourceType: string; // "freeagents", "waivers", "team"
  sourceTeamKey: string | null;
  sourceTeamName: string | null;
  destinationTeamKey: string | null;
  destinationTeamName: string | null;
}

// --- Player ---

export interface Player {
  playerKey: string;
  playerId: number;
  playerName: string;
  position: string;
  nflTeam: string;
  status: string | null;
  imageUrl: string | null;
  byeWeek: number;
  percentOwned: number;
}

// --- Cached Data Wrapper ---

export interface CachedData<T> {
  data: T;
  fetchedAt: number; // Unix timestamp ms
  ttl: number; // TTL in seconds
}

// --- OAuth Tokens ---

export interface YahooTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: number; // Unix timestamp ms
}
