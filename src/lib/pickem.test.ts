import { describe, it, expect } from "vitest";
import {
  axisPosition,
  buildAgreement,
  buildBoard,
  buildContrarians,
  buildIdenticalGroups,
  buildScoreboard,
  buildSpreads,
  type PickemData,
  type PickemResult,
} from "./pickem";

const team = (seed: number, name: string) => ({ seed, name, record: "1-0-0" });

/** Two games, so a 2-2 split is expressible without a mountain of fixture. */
function fixture(
  entries: { name: string; picks: [string, number][]; total?: number }[],
): PickemData {
  return {
    season: 2026,
    week: 8,
    roster: ["Ann", "Bob", "Cal", "Dee"],
    games: [
      { id: 1, teams: [team(1, "Reds"), team(2, "Blues")] },
      { id: 2, teams: [team(3, "Greens"), team(4, "Golds")] },
    ],
    entries: entries.map((e) => ({
      name: e.name,
      picks: e.picks.map(([t, total]) => ({ team: t, total })),
      total: e.total ?? e.picks.reduce((s, [, v]) => s + v, 0),
    })),
  };
}

describe("buildBoard", () => {
  it("names the side the room is on and lists its backers", () => {
    const board = buildBoard(
      fixture([
        { name: "Ann", picks: [["Reds", 100], ["Greens", 200]] },
        { name: "Bob", picks: [["Reds", 110], ["Golds", 210]] },
        { name: "Cal", picks: [["Blues", 120], ["Greens", 220]] },
      ]),
    );

    expect(board[0].consensus).toBe("Reds");
    expect(board[0].tally[0].backers).toEqual(["Ann", "Bob"]);
    expect(board[0].tally[1].backers).toEqual(["Cal"]);
    expect(board[0].averageTotal).toBeCloseTo(110);
  });

  it("crowns nobody when the room splits evenly", () => {
    const board = buildBoard(
      fixture([
        { name: "Ann", picks: [["Reds", 100], ["Greens", 200]] },
        { name: "Bob", picks: [["Blues", 100], ["Greens", 200]] },
      ]),
    );

    expect(board[0].consensus).toBeNull();
  });

  it("survives a week with no cards submitted", () => {
    const board = buildBoard(fixture([]));

    expect(board[0].consensus).toBeNull();
    expect(board[0].votes).toBe(0);
    expect(board[0].averageTotal).toBe(0);
  });
});

describe("buildAgreement", () => {
  it("counts matching picks and ranks the most alike pair first", () => {
    const { rows, pairs } = buildAgreement(
      fixture([
        { name: "Ann", picks: [["Reds", 100], ["Greens", 200]] },
        { name: "Bob", picks: [["Reds", 100], ["Greens", 200]] },
        { name: "Cal", picks: [["Blues", 100], ["Golds", 200]] },
      ]),
    );

    expect(rows[0][1]).toBe(2); // Ann and Bob are identical
    expect(rows[0][2]).toBe(0); // Ann and Cal share nothing
    expect(pairs[0]).toEqual({ a: "Ann", b: "Bob", agreed: 2 });
    expect(pairs.at(-1)?.agreed).toBe(0);
  });
});

describe("buildSpreads", () => {
  it("reports the range and who sits at each end", () => {
    const data = fixture([
      { name: "Ann", picks: [["Reds", 300], ["Greens", 200]] },
      { name: "Bob", picks: [["Reds", 420], ["Greens", 200]] },
      { name: "Cal", picks: [["Blues", 360], ["Golds", 260]] },
    ]);
    const { spreads, scaleMin, scaleMax } = buildSpreads(data);

    expect(spreads[0].min).toBe(300);
    expect(spreads[0].max).toBe(420);
    expect(spreads[0].lowest).toEqual(["Ann"]);
    expect(spreads[0].highest).toEqual(["Bob"]);
    // A unanimous game can still be unanimous on the number.
    expect(spreads[1].lowest).toEqual(["Ann", "Bob"]);
    // Axis snaps outward to 25s across every game.
    expect(scaleMin).toBe(200);
    expect(scaleMax).toBe(425);
  });
});

describe("buildContrarians", () => {
  it("only counts games that had a grain to go against", () => {
    const data = fixture([
      { name: "Ann", picks: [["Reds", 100], ["Greens", 200]] },
      { name: "Bob", picks: [["Reds", 100], ["Golds", 200]] },
      { name: "Cal", picks: [["Blues", 100], ["Greens", 200]] },
    ]);
    const board = buildBoard(data);
    const contrarians = buildContrarians(data, board);

    // Game 2 is 2-1 for Greens, game 1 is 2-1 for Reds.
    expect(contrarians.find((c) => c.name === "Cal")?.against).toBe(1);
    expect(contrarians.find((c) => c.name === "Bob")?.against).toBe(1);
    expect(contrarians.find((c) => c.name === "Ann")?.against).toBe(0);
  });

  it("blames nobody when every game is a dead heat", () => {
    const data = fixture([
      { name: "Ann", picks: [["Reds", 100], ["Greens", 200]] },
      { name: "Bob", picks: [["Blues", 100], ["Golds", 200]] },
    ]);
    const contrarians = buildContrarians(data, buildBoard(data));

    expect(contrarians.every((c) => c.against === 0)).toBe(true);
  });
});

describe("buildIdenticalGroups", () => {
  it("gathers three matching cards into one group, not three pairs", () => {
    const groups = buildIdenticalGroups(
      fixture([
        { name: "Ann", picks: [["Reds", 100], ["Greens", 200]] },
        { name: "Bob", picks: [["Reds", 111], ["Greens", 222]] },
        { name: "Cal", picks: [["Reds", 133], ["Greens", 244]] },
        { name: "Dee", picks: [["Blues", 100], ["Golds", 200]] },
      ]),
    );

    expect(groups).toEqual([["Ann", "Bob", "Cal"]]);
  });

  it("keeps separate blocs apart and sorts the biggest first", () => {
    const groups = buildIdenticalGroups(
      fixture([
        { name: "Ann", picks: [["Reds", 100], ["Greens", 200]] },
        { name: "Bob", picks: [["Blues", 100], ["Golds", 200]] },
        { name: "Cal", picks: [["Reds", 100], ["Greens", 200]] },
        { name: "Dee", picks: [["Blues", 100], ["Golds", 200]] },
      ]),
    );

    expect(groups).toHaveLength(2);
    expect(groups).toContainEqual(["Ann", "Cal"]);
    expect(groups).toContainEqual(["Bob", "Dee"]);
  });

  it("groups on picks alone, ignoring predicted scores", () => {
    const groups = buildIdenticalGroups(
      fixture([
        { name: "Ann", picks: [["Reds", 100], ["Greens", 200]] },
        { name: "Bob", picks: [["Reds", 999], ["Greens", 1]] },
      ]),
    );

    expect(groups).toEqual([["Ann", "Bob"]]);
  });

  it("returns nothing when nobody matches", () => {
    const groups = buildIdenticalGroups(
      fixture([
        { name: "Ann", picks: [["Reds", 100], ["Greens", 200]] },
        { name: "Bob", picks: [["Reds", 100], ["Golds", 200]] },
      ]),
    );

    expect(groups).toEqual([]);
  });

  it("does not call empty cards identical when there are no games", () => {
    const data = fixture([
      { name: "Ann", picks: [] },
      { name: "Bob", picks: [] },
    ]);

    expect(buildIdenticalGroups({ ...data, games: [] })).toEqual([]);
  });
});

describe("buildScoreboard", () => {
  const withResults = (
    data: PickemData,
    results: PickemResult[],
  ): PickemData => ({ ...data, results });

  const threeCards = () =>
    fixture([
      { name: "Ann", picks: [["Reds", 100], ["Greens", 200]] },
      { name: "Bob", picks: [["Reds", 150], ["Golds", 250]] },
      { name: "Cal", picks: [["Blues", 120], ["Golds", 210]] },
    ]);

  it("scores nothing before any game is final", () => {
    const board = buildScoreboard(threeCards());

    expect(board.decided).toBe(0);
    expect(board.complete).toBe(false);
    expect(board.actualTotal).toBeNull();
    expect(board.rows.every((r) => r.correct === 0)).toBe(true);
    expect(board.rows.every((r) => r.marks.every((m) => m === null))).toBe(
      true,
    );
  });

  it("scores only the games that are final so far", () => {
    const board = buildScoreboard(
      withResults(threeCards(), [
        { winner: "Reds", total: 180 },
        { winner: null, total: null },
      ]),
    );

    expect(board.decided).toBe(1);
    expect(board.complete).toBe(false);
    // The second game is undecided, so it is neither right nor wrong.
    expect(board.rows.find((r) => r.name === "Ann")?.marks).toEqual([
      true,
      null,
    ]);
    expect(board.rows.find((r) => r.name === "Cal")?.marks).toEqual([
      false,
      null,
    ]);
    expect(board.rows.find((r) => r.name === "Cal")?.correct).toBe(0);
  });

  it("holds the tiebreaker back until every total is known", () => {
    const board = buildScoreboard(
      withResults(threeCards(), [
        { winner: "Reds", total: 180 },
        { winner: "Golds", total: null },
      ]),
    );

    expect(board.actualTotal).toBeNull();
    expect(board.rows.every((r) => r.tiebreakerDiff === null)).toBe(true);
    expect(board.complete).toBe(false);
  });

  it("ranks on games won, then on the tiebreaker once it is in", () => {
    // Bob goes 2-for-2 so he leads outright. Ann and Cal both go 1-for-2,
    // and only the tiebreaker separates them: the real total is 390, Cal
    // predicted 330 and Ann predicted 300, so Cal edges ahead.
    const board = buildScoreboard(
      withResults(threeCards(), [
        { winner: "Reds", total: 190 },
        { winner: "Golds", total: 200 },
      ]),
    );

    expect(board.actualTotal).toBe(390);
    expect(board.complete).toBe(true);

    expect(board.rows.map((r) => r.name)).toEqual(["Bob", "Cal", "Ann"]);
    expect(board.rows.map((r) => r.correct)).toEqual([2, 1, 1]);
    expect(board.rows.map((r) => r.tiebreakerDiff)).toEqual([10, 60, 90]);
    expect(board.rows.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("lets genuinely tied managers share a rank", () => {
    const data = fixture([
      { name: "Ann", picks: [["Reds", 100], ["Greens", 100]] },
      { name: "Bob", picks: [["Reds", 100], ["Greens", 100]] },
      { name: "Cal", picks: [["Blues", 100], ["Golds", 100]] },
    ]);
    const board = buildScoreboard(
      withResults(data, [
        { winner: "Reds", total: 100 },
        { winner: "Greens", total: 100 },
      ]),
    );

    expect(board.rows[0].rank).toBe(1);
    expect(board.rows[1].rank).toBe(1);
    expect(board.rows[2].rank).toBe(3);
  });

  it("flags a misspelled winner instead of marking everyone wrong", () => {
    const board = buildScoreboard(
      withResults(threeCards(), [
        { winner: "Red", total: 180 },
        { winner: null, total: null },
      ]),
    );

    expect(board.problems).toHaveLength(1);
    expect(board.problems[0]).toContain("Game 1");
    expect(board.decided).toBe(0);
    expect(board.rows.every((r) => r.correct === 0)).toBe(true);
  });
});

describe("axisPosition", () => {
  it("maps a value onto the axis and clamps outside it", () => {
    expect(axisPosition(250, 200, 400)).toBe(25);
    expect(axisPosition(100, 200, 400)).toBe(0);
    expect(axisPosition(500, 200, 400)).toBe(100);
  });

  it("does not divide by zero on a flat axis", () => {
    expect(axisPosition(300, 300, 300)).toBe(0);
  });
});
