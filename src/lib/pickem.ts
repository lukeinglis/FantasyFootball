/**
 * Derived views over the weekly pick'em cards.
 *
 * Everything here is a pure function of `src/data/pickem.json` so the page
 * stays independent of the Yahoo feed, which is what the contest needs while
 * API access is broken.
 */

export interface PickemTeam {
  seed: number;
  name: string;
  record: string;
}

export interface PickemGame {
  id: number;
  teams: PickemTeam[];
}

export interface PickemPick {
  team: string;
  total: number;
}

export interface PickemEntry {
  name: string;
  picks: PickemPick[];
  total: number;
}

/**
 * One game's score. `scores` is index-aligned with the game's own `teams`,
 * which is why results carry no team names: there is nothing to misspell.
 *
 * `projected` is Yahoo's projected finish for each team. Yahoo collapses it
 * onto the live score once a team has nobody left to play, which is the only
 * reliable signal for whether a number can still move, so it is what tells
 * this page when a game is over. `final` is a manual override for when
 * projections are unavailable.
 */
export interface PickemResult {
  scores: number[] | null;
  projected?: number[] | null;
  final?: boolean;
}

export interface PickemData {
  season: number;
  week: number;
  roster: string[];
  games: PickemGame[];
  entries: PickemEntry[];
  results?: PickemResult[];
}

/**
 * A game's live score, with both "who won" and "what the score was" derived
 * rather than typed. The two are deliberately separate: a game can have a
 * settled winner while its score is still climbing.
 */
export interface GameScore {
  /** Index-aligned with the game's teams; null when no score is in yet. */
  scores: number[] | null;
  /** Who is ahead right now. Null when level or when no score is in yet. */
  leader: string | null;
  /** Combined score so far; null when no score is in yet. */
  total: number | null;
  /** True when neither score can move again, so the total can be trusted. */
  final: boolean;
  /**
   * The winner, once the result can no longer change. This happens as soon as
   * the trailing team runs out of players, which is usually before the game
   * is final: the leader can still pile on, but nobody can catch them.
   */
  winner: string | null;
}

/**
 * Reads the score slot for each game. A result whose numbers do not line up
 * with the matchup is reported rather than guessed at, and treated as no score
 * at all, so one bad row cannot mark the whole league wrong.
 */
export function buildScores(data: PickemData): {
  scores: GameScore[];
  problems: string[];
} {
  const { games, results = [] } = data;
  const problems: string[] = [];

  const scores = games.map((game, i): GameScore => {
    const result = results[i];
    const blank: GameScore = {
      scores: null,
      leader: null,
      total: null,
      final: false,
      winner: null,
    };
    if (result === undefined) return blank;

    const raw = result.scores;
    if (raw === null || raw === undefined) {
      if (result.final) {
        problems.push(`Game ${game.id} is marked final but has no score`);
      }
      return blank;
    }

    if (raw.length !== game.teams.length || raw.some((n) => !isFinite(n))) {
      problems.push(
        `Game ${game.id} needs ${game.teams.length} numeric scores, one per team`,
      );
      return blank;
    }

    const projected = result.projected ?? null;
    if (
      projected !== null &&
      (projected.length !== raw.length || projected.some((n) => !isFinite(n)))
    ) {
      problems.push(
        `Game ${game.id} needs ${game.teams.length} numeric projections, one per team`,
      );
      return blank;
    }

    // A team whose projection has caught up to its score has nobody left to
    // play, so its number is fixed for the rest of the week.
    const done = raw.map((n, t) =>
      projected === null ? (result.final ?? false) : n >= projected[t],
    );

    const best = Math.max(...raw);
    const atBest = raw.filter((n) => n === best).length;
    // A level game crowns nobody, the same way an even split of picks does.
    const leader =
      atBest > 1 ? null : (game.teams[raw.indexOf(best)]?.name ?? null);

    const final = (result.final ?? false) || done.every(Boolean);
    // Everyone except the leader has to be finished for the result to be safe;
    // whether the leader is still scoring is irrelevant, since their lead can
    // only grow.
    const chasersDone = done.every((d, t) => d || game.teams[t]?.name === leader);

    return {
      scores: raw,
      leader,
      total: raw.reduce((sum, n) => sum + n, 0),
      final,
      winner: leader !== null && chasersDone ? leader : null,
    };
  });

  return { scores, problems };
}

export interface GameBoard {
  game: PickemGame;
  tally: { team: PickemTeam; backers: string[] }[];
  votes: number;
  averageTotal: number;
  /** Null when the room is split evenly, so a 4-4 game crowns nobody. */
  consensus: string | null;
  /** Live or final score, so the board doubles as a scoreboard on Sunday. */
  score: GameScore;
}

export function buildBoard(data: PickemData): GameBoard[] {
  const { games, entries } = data;
  const { scores } = buildScores(data);

  return games.map((game, index) => {
    const tally = game.teams.map((team) => ({
      team,
      backers: entries
        .filter((e) => e.picks[index]?.team === team.name)
        .map((e) => e.name),
    }));

    const votes = entries.length;
    const counts = tally.map((t) => t.backers.length);
    const topCount = counts.length > 0 ? Math.max(...counts) : 0;
    const tied = counts.filter((c) => c === topCount).length > 1;

    const averageTotal =
      votes > 0
        ? entries.reduce((sum, e) => sum + (e.picks[index]?.total ?? 0), 0) /
          votes
        : 0;

    return {
      game,
      tally,
      votes,
      averageTotal,
      consensus:
        votes === 0 || tied
          ? null
          : (tally.find((t) => t.backers.length === topCount)?.team.name ??
            null),
      score: scores[index],
    };
  });
}

export interface AgreementMatrix {
  names: string[];
  /** rows[i][j] is how many of the games i and j picked the same way. */
  rows: number[][];
  gameCount: number;
  pairs: { a: string; b: string; agreed: number }[];
}

/**
 * How alike each pair of cards is. The pair list is sorted most-alike first,
 * which is where the "identical card" callouts come from.
 */
export function buildAgreement(data: PickemData): AgreementMatrix {
  const entries = data.entries;
  const names = entries.map((e) => e.name);
  const gameCount = data.games.length;

  const agreed = (a: PickemEntry, b: PickemEntry) =>
    data.games.reduce(
      (sum, _game, i) =>
        sum + (a.picks[i]?.team === b.picks[i]?.team ? 1 : 0),
      0,
    );

  const rows = entries.map((a) => entries.map((b) => agreed(a, b)));

  const pairs: AgreementMatrix["pairs"] = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      pairs.push({
        a: entries[i].name,
        b: entries[j].name,
        agreed: rows[i][j],
      });
    }
  }
  pairs.sort((x, y) => y.agreed - x.agreed);

  return { names, rows, gameCount, pairs };
}

/**
 * Managers whose cards are identical, grouped rather than listed pair by
 * pair. Picking the same way is transitive, so three managers with the same
 * card are one bloc of three, not three separate pairs.
 *
 * Only the picked teams count, not the predicted scores, which is the same
 * thing `agreed === gameCount` means in the pair list.
 */
export function buildIdenticalGroups(data: PickemData): string[][] {
  // With no games every card is trivially "identical"; that is noise.
  if (data.games.length === 0) return [];

  const byCard = new Map<string, string[]>();
  for (const entry of data.entries) {
    const key = data.games
      .map((_game, i) => entry.picks[i]?.team ?? "")
      .join("\u0000");
    const group = byCard.get(key);
    if (group) group.push(entry.name);
    else byCard.set(key, [entry.name]);
  }

  return [...byCard.values()]
    .filter((group) => group.length > 1)
    .map((group) => [...group].sort((a, b) => a.localeCompare(b)))
    .sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
}

export interface GameSpread {
  game: PickemGame;
  min: number;
  max: number;
  average: number;
  marks: { name: string; total: number }[];
  lowest: string[];
  highest: string[];
}

export interface SpreadView {
  spreads: GameSpread[];
  /** Shared axis bounds so games can be compared against each other. */
  scaleMin: number;
  scaleMax: number;
}

/**
 * Per-game range of predicted combined scores. The axis is shared across all
 * six games on purpose: a game everyone agrees on can still have the widest
 * disagreement about the score, and a per-game axis would hide that.
 */
export function buildSpreads(data: PickemData): SpreadView {
  const { games, entries } = data;

  const spreads: GameSpread[] = games.map((game, index) => {
    const marks = entries
      .map((e) => ({ name: e.name, total: e.picks[index]?.total ?? 0 }))
      .sort((a, b) => a.total - b.total);

    const totals = marks.map((m) => m.total);
    const min = totals.length > 0 ? Math.min(...totals) : 0;
    const max = totals.length > 0 ? Math.max(...totals) : 0;
    const average =
      totals.length > 0
        ? totals.reduce((s, t) => s + t, 0) / totals.length
        : 0;

    return {
      game,
      min,
      max,
      average,
      marks,
      lowest: marks.filter((m) => m.total === min).map((m) => m.name),
      highest: marks.filter((m) => m.total === max).map((m) => m.name),
    };
  });

  const allTotals = spreads.flatMap((s) => s.marks.map((m) => m.total));
  const rawMin = allTotals.length > 0 ? Math.min(...allTotals) : 0;
  const rawMax = allTotals.length > 0 ? Math.max(...allTotals) : 0;

  return {
    spreads,
    scaleMin: Math.floor(rawMin / 25) * 25,
    scaleMax: Math.ceil(rawMax / 25) * 25,
  };
}

/**
 * How often someone backed the side the room did not. Games with no consensus
 * do not count against anyone, since there was no grain to go against.
 */
export function buildContrarians(
  data: PickemData,
  board: GameBoard[],
): { name: string; against: number }[] {
  return data.entries
    .map((entry) => ({
      name: entry.name,
      against: entry.picks.filter(
        (pick, i) =>
          board[i]?.consensus !== null && board[i]?.consensus !== pick.team,
      ).length,
    }))
    .sort((a, b) => b.against - a.against || a.name.localeCompare(b.name));
}

export interface ScoreRow {
  name: string;
  /** Per game: true right, false wrong, null not decided yet. */
  marks: (boolean | null)[];
  correct: number;
  /** The manager's own predicted tiebreaker, carried through for display. */
  predicted: number;
  /** Distance from the real combined total; null until every game is final. */
  tiebreakerDiff: number | null;
  /** Shared by managers who are genuinely tied. */
  rank: number;
}

export interface Scoreboard {
  rows: ScoreRow[];
  /** Games with a known winner. */
  decided: number;
  gameCount: number;
  /** Sum of the real totals; null until every game is final. */
  actualTotal: number | null;
  complete: boolean;
  /**
   * Malformed result rows. Surfaced in the UI rather than thrown, so one bad
   * entry made mid-weekend cannot blank the page or quietly mark everybody
   * wrong.
   */
  problems: string[];
}

export function buildScoreboard(data: PickemData): Scoreboard {
  const { games, entries } = data;
  const { scores, problems } = buildScores(data);

  // Picks settle as soon as the result is beyond doubt, which is earlier than
  // the final whistle: once the chasing team is out of players, the lead
  // cannot be overturned no matter how many points the leader adds.
  const winners = scores.map((s) => s.winner);

  // The tiebreaker is a different question, and a stricter one. It is the sum
  // of the real combined scores, so it has to wait for every last point.
  const everyGameFinal =
    games.length > 0 && scores.every((s) => s.final && s.total !== null);
  const actualTotal = everyGameFinal
    ? scores.reduce((sum, s) => sum + (s.total ?? 0), 0)
    : null;

  const scored = entries.map((entry) => {
    const marks = games.map((_, i) => {
      const winner = winners[i];
      if (winner === null) return null;
      return entry.picks[i]?.team === winner;
    });

    return {
      name: entry.name,
      marks,
      correct: marks.filter((m) => m === true).length,
      predicted: entry.total,
      tiebreakerDiff:
        actualTotal === null ? null : Math.abs(entry.total - actualTotal),
    };
  });

  // Most games right wins; the tiebreaker only separates people once it is
  // actually known, so before then equal records stay equal.
  scored.sort(
    (a, b) =>
      b.correct - a.correct ||
      (a.tiebreakerDiff ?? 0) - (b.tiebreakerDiff ?? 0) ||
      a.name.localeCompare(b.name),
  );

  const rows: ScoreRow[] = scored.map((row, i, all) => {
    const prev = all[i - 1];
    const ties =
      prev !== undefined &&
      prev.correct === row.correct &&
      prev.tiebreakerDiff === row.tiebreakerDiff;
    return { ...row, rank: ties ? 0 : i + 1 };
  });

  // Second pass so tied managers share the rank of the first of their group.
  rows.forEach((row, i) => {
    if (row.rank === 0) row.rank = rows[i - 1].rank;
  });

  const decided = winners.filter((w) => w !== null).length;

  return {
    rows,
    decided,
    gameCount: games.length,
    actualTotal,
    // Keyed off every game being final rather than off `decided`, so a final
    // game that ended level does not leave the week permanently unfinished.
    complete: everyGameFinal,
    problems,
  };
}

/** Position of a value on the shared axis, as a 0-100 percentage. */
export function axisPosition(
  value: number,
  scaleMin: number,
  scaleMax: number,
): number {
  if (scaleMax <= scaleMin) return 0;
  const pct = ((value - scaleMin) / (scaleMax - scaleMin)) * 100;
  return Math.min(100, Math.max(0, pct));
}
