import { describe, it, expect } from "vitest";
import {
  axisPosition,
  buildAgreement,
  buildBoard,
  buildContrarians,
  buildIdenticalGroups,
  buildOutlook,
  buildScoreboard,
  buildScores,
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
        { scores: [120, 60], final: true },
        { scores: null, final: false },
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

  it("marks picks on a settled game while withholding the tiebreaker", () => {
    // Reds have won game 1 — Blues are out of players — but Reds are still
    // scoring, so the week's combined total is not known yet.
    const board = buildScoreboard(
      withResults(threeCards(), [
        { scores: [120, 60], projected: [150, 60] },
        { scores: [90, 110], projected: [130, 140] },
      ]),
    );

    expect(board.decided).toBe(1);
    expect(board.rows.find((r) => r.name === "Ann")?.marks).toEqual([
      true,
      null,
    ]);
    expect(board.rows.find((r) => r.name === "Cal")?.marks).toEqual([
      false,
      null,
    ]);
    expect(board.actualTotal).toBeNull();
    expect(board.complete).toBe(false);
  });

  it("does not score a game that has a score but is still being played", () => {
    const board = buildScoreboard(
      withResults(threeCards(), [
        { scores: [120, 60], final: true },
        // Golds are ahead, but the game is not over, so nobody is right yet.
        { scores: [90, 110], final: false },
      ]),
    );

    expect(board.decided).toBe(1);
    expect(board.rows.every((r) => r.marks[1] === null)).toBe(true);
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
        { scores: [100, 90], final: true },
        { scores: [90, 110], final: true },
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
        { scores: [60, 40], final: true },
        { scores: [60, 40], final: true },
      ]),
    );

    expect(board.rows[0].rank).toBe(1);
    expect(board.rows[1].rank).toBe(1);
    expect(board.rows[2].rank).toBe(3);
  });

  it("crowns nobody in a game that finished level, but still calls it over", () => {
    const board = buildScoreboard(
      withResults(threeCards(), [
        { scores: [100, 100], final: true },
        { scores: [90, 110], final: true },
      ]),
    );

    // A drawn game is nobody's to win, yet the week is finished and the
    // tiebreaker is known, so the standings must not hang forever.
    expect(board.decided).toBe(1);
    expect(board.complete).toBe(true);
    expect(board.actualTotal).toBe(400);
    expect(board.rows.every((r) => r.marks[0] === null)).toBe(true);
  });

  it("flags a score that does not line up with the matchup", () => {
    const board = buildScoreboard(
      withResults(threeCards(), [
        { scores: [180], final: true },
        { scores: null, final: false },
      ]),
    );

    expect(board.problems).toHaveLength(1);
    expect(board.problems[0]).toContain("Game 1");
    expect(board.decided).toBe(0);
    expect(board.rows.every((r) => r.correct === 0)).toBe(true);
  });

  it("flags a game marked final with no score at all", () => {
    const board = buildScoreboard(
      withResults(threeCards(), [
        { scores: null, final: true },
        { scores: null, final: false },
      ]),
    );

    expect(board.problems).toHaveLength(1);
    expect(board.problems[0]).toContain("Game 1");
    expect(board.decided).toBe(0);
  });
});

describe("buildScores", () => {
  const live = (results: PickemResult[]) =>
    buildScores({
      ...fixture([{ name: "Ann", picks: [["Reds", 100], ["Greens", 200]] }]),
      results,
    });

  it("derives the leader and the combined total from the score", () => {
    const { scores, problems } = live([
      { scores: [120.5, 60.25], final: true },
      { scores: [90, 110], final: false },
    ]);

    expect(problems).toEqual([]);
    expect(scores[0].leader).toBe("Reds");
    expect(scores[0].total).toBeCloseTo(180.75);
    expect(scores[0].final).toBe(true);
    // Still in progress, but the score is worth showing.
    expect(scores[1].leader).toBe("Golds");
    expect(scores[1].final).toBe(false);
  });

  it("leaves a game with no score blank rather than zeroed", () => {
    const { scores, problems } = live([]);

    expect(problems).toEqual([]);
    expect(scores[0]).toEqual({
      scores: null,
      leader: null,
      total: null,
      final: false,
      winner: null,
    });
  });

  it("settles the winner once the trailing team is out of players", () => {
    // Reds lead and are still scoring; Blues have caught their projection,
    // so Blues cannot add another point and cannot catch up.
    const { scores } = live([
      { scores: [120, 60], projected: [150, 60] },
      { scores: [0, 0], projected: null },
    ]);

    expect(scores[0].winner).toBe("Reds");
    // The result is safe, but the score is not done moving.
    expect(scores[0].final).toBe(false);
  });

  it("does not settle a game while the trailing team can still score", () => {
    // Reds are done and lead by 60; Blues only project to add 35 more, but a
    // projection is not a ceiling, so the game is not beyond doubt.
    const { scores } = live([
      { scores: [120, 60], projected: [120, 95] },
      { scores: [0, 0], projected: null },
    ]);

    expect(scores[0].winner).toBeNull();
    expect(scores[0].leader).toBe("Reds");
    expect(scores[0].final).toBe(false);
  });

  it("calls a game final only when both teams are out of players", () => {
    const { scores } = live([
      { scores: [120, 60], projected: [120, 60] },
      { scores: [0, 0], projected: null },
    ]);

    expect(scores[0].final).toBe(true);
    expect(scores[0].winner).toBe("Reds");
  });

  it("falls back to the manual flag when projections are missing", () => {
    const { scores } = live([
      { scores: [120, 60], final: true },
      { scores: [90, 110], final: false },
    ]);

    expect(scores[0].final).toBe(true);
    expect(scores[0].winner).toBe("Reds");
    expect(scores[1].final).toBe(false);
    expect(scores[1].winner).toBeNull();
  });

  it("flags projections that do not line up with the matchup", () => {
    const { problems } = live([
      { scores: [120, 60], projected: [150] },
      { scores: null, projected: null },
    ]);

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("Game 1");
  });
});

describe("buildOutlook", () => {
  it("leaves out a game the whole room picked the same way", () => {
    // Everyone took Reds in game 1, so it cannot reorder anybody; only
    // game 2 can.
    const outlook = buildOutlook(
      fixture([
        { name: "Ann", picks: [["Reds", 100], ["Greens", 200]] },
        { name: "Bob", picks: [["Reds", 100], ["Golds", 200]] },
      ]),
    );

    expect(outlook.pivotal.map((g) => g.id)).toEqual([2]);
    expect(outlook.unanimous.map((g) => g.id)).toEqual([1]);
    expect(outlook.scenarios).toHaveLength(2);
    expect(outlook.eliminated).toEqual([]);
  });

  it("eliminates a card that another card beats on every branch", () => {
    // Bob has the same game 2 pick as Ann but is a game behind her, so the
    // only result that helps him helps her by the same amount. Cal is level
    // with Ann and needs the other result, so between them they cover both
    // branches and Bob is left with none.
    const data = fixture([
      { name: "Ann", picks: [["Reds", 100], ["Greens", 200]] },
      { name: "Bob", picks: [["Blues", 100], ["Greens", 200]] },
      { name: "Cal", picks: [["Reds", 100], ["Golds", 200]] },
    ]);
    const outlook = buildOutlook({
      ...data,
      // Game 1 is in the bag for Reds; game 2 is still open.
      results: [
        { scores: [120, 60], projected: [120, 60] },
        { scores: [90, 95], projected: [140, 150] },
      ],
    });

    expect(outlook.pivotal.map((g) => g.id)).toEqual([2]);
    expect(outlook.eliminated).toEqual(["Bob"]);
    expect(outlook.alive).toEqual(["Ann", "Cal"]);
  });

  it("names who would be on top under each way the games can fall", () => {
    const outlook = buildOutlook(
      fixture([
        { name: "Ann", picks: [["Reds", 100], ["Greens", 200]] },
        { name: "Bob", picks: [["Blues", 100], ["Golds", 200]] },
      ]),
    );

    const byOutcome = Object.fromEntries(
      outlook.scenarios.map((s) => [s.outcome.join("+"), s.winners]),
    );
    expect(byOutcome["Reds+Greens"]).toEqual(["Ann"]);
    expect(byOutcome["Blues+Golds"]).toEqual(["Bob"]);
    // One apiece leaves them level, which the tiebreaker would settle.
    expect(byOutcome["Reds+Golds"]).toEqual(["Ann", "Bob"]);
  });

  it("counts a card that can only draw level as still alive", () => {
    const data = fixture([
      { name: "Ann", picks: [["Reds", 100], ["Greens", 200]] },
      { name: "Bob", picks: [["Blues", 100], ["Golds", 200]] },
    ]);
    const outlook = buildOutlook({
      ...data,
      // Ann has game 1, so the best game 2 can do for Bob is pull him level.
      // Level is not out: the tiebreaker has not been applied yet.
      results: [
        { scores: [120, 60], projected: [120, 60] },
        { scores: [90, 95], projected: [140, 150] },
      ],
    });

    expect(outlook.eliminated).toEqual([]);
    expect(outlook.alive).toEqual(["Ann", "Bob"]);
  });

  it("has nothing left to enumerate once every game is settled", () => {
    const data = fixture([
      { name: "Ann", picks: [["Reds", 100], ["Greens", 200]] },
      { name: "Bob", picks: [["Blues", 100], ["Golds", 200]] },
    ]);
    const outlook = buildOutlook({
      ...data,
      results: [
        { scores: [120, 60], projected: [120, 60] },
        { scores: [90, 95], projected: [90, 95] },
      ],
    });

    expect(outlook.pivotal).toEqual([]);
    expect(outlook.scenarios).toHaveLength(1);
    // Ann took game 1, Bob took game 2, so they finish level on games won.
    expect(outlook.scenarios[0].winners).toEqual(["Ann", "Bob"]);
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
