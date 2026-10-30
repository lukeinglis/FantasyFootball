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
 * One game's outcome. Both fields stay null until the game is final, so
 * results can be filled in one game at a time as the weekend plays out.
 */
export interface PickemResult {
  winner: string | null;
  /** The actual combined score of both teams. */
  total: number | null;
}

export interface PickemData {
  season: number;
  week: number;
  roster: string[];
  games: PickemGame[];
  entries: PickemEntry[];
  results?: PickemResult[];
}

export interface GameBoard {
  game: PickemGame;
  tally: { team: PickemTeam; backers: string[] }[];
  votes: number;
  averageTotal: number;
  /** Null when the room is split evenly, so a 4-4 game crowns nobody. */
  consensus: string | null;
}

export function buildBoard(data: PickemData): GameBoard[] {
  const { games, entries } = data;

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
   * Results that name a team which is not in that matchup. Surfaced in the
   * UI rather than thrown, so one typo entered mid-weekend cannot blank the
   * page or quietly mark everybody wrong.
   */
  problems: string[];
}

export function buildScoreboard(data: PickemData): Scoreboard {
  const { games, entries, results = [] } = data;
  const problems: string[] = [];

  const winners = games.map((game, i) => {
    const winner = results[i]?.winner ?? null;
    if (winner === null) return null;
    if (!game.teams.some((t) => t.name === winner)) {
      problems.push(
        `Game ${game.id} lists "${winner}" as the winner, which is not ${game.teams
          .map((t) => `"${t.name}"`)
          .join(" or ")}`,
      );
      return null;
    }
    return winner;
  });

  const totals = games.map((_, i) => results[i]?.total ?? null);
  const everyTotalIn =
    games.length > 0 && totals.every((t) => typeof t === "number");
  const actualTotal = everyTotalIn
    ? (totals as number[]).reduce((sum, t) => sum + t, 0)
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
    complete: decided === games.length && actualTotal !== null,
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
