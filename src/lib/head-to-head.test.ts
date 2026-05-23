import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Rivalry } from "./head-to-head";

vi.mock("fs", () => ({
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { readdirSync, readFileSync } from "fs";
import { computeHeadToHead, getAllManagers } from "./head-to-head";

const mockedReaddir = vi.mocked(readdirSync);
const mockedReadFile = vi.mocked(readFileSync);

function setupSeasons(seasons: object[]) {
  const filenames = seasons.map((_, i) => `season_${i}.json`);
  mockedReaddir.mockReturnValue(filenames as never);
  mockedReadFile.mockImplementation(((path: string) => {
    const idx = filenames.findIndex((f) => (path as string).endsWith(f));
    return JSON.stringify(seasons[idx]);
  }) as typeof readFileSync);
}

function matchup(overrides: Partial<{
  week: number;
  isPlayoffs: boolean;
  isConsolation: boolean;
  team1: string;
  manager1: string;
  points1: number;
  team2: string;
  manager2: string;
  points2: number;
}> = {}) {
  return {
    week: 1,
    isPlayoffs: false,
    isConsolation: false,
    team1: "Team A",
    manager1: "Alice",
    points1: 100,
    team2: "Team B",
    manager2: "Bob",
    points2: 90,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("computeHeadToHead", () => {
  it("returns empty array when no season files exist", () => {
    mockedReaddir.mockReturnValue([]);
    const result = computeHeadToHead();
    expect(result).toEqual([]);
  });

  it("returns empty array when directory read fails", () => {
    mockedReaddir.mockImplementation(() => {
      throw new Error("ENOENT");
    });
    const result = computeHeadToHead();
    expect(result).toEqual([]);
  });

  it("tracks a single regular season win correctly", () => {
    setupSeasons([{
      season: 2023,
      matchups: [matchup({ manager1: "Alice", points1: 110, manager2: "Bob", points2: 90 })],
    }]);

    const result = computeHeadToHead();
    expect(result).toHaveLength(1);
    const r = result[0];
    expect(r.totalGames).toBe(1);
    expect(r.manager1).toBe("Alice");
    expect(r.manager2).toBe("Bob");
    expect(r.regularSeason.wins).toBe(1);
    expect(r.regularSeason.losses).toBe(0);
    expect(r.regularSeason.pointsFor).toBe(110);
    expect(r.regularSeason.pointsAgainst).toBe(90);
    expect(r.regularSeason.games).toBe(1);
  });

  it("tracks a loss for manager1 (alphabetically first) when manager2 scores more", () => {
    setupSeasons([{
      season: 2023,
      matchups: [matchup({ manager1: "Alice", points1: 80, manager2: "Bob", points2: 100 })],
    }]);

    const result = computeHeadToHead();
    const r = result[0];
    expect(r.regularSeason.wins).toBe(0);
    expect(r.regularSeason.losses).toBe(1);
    expect(r.regularSeason.pointsFor).toBe(80);
    expect(r.regularSeason.pointsAgainst).toBe(100);
  });

  it("separates playoff from regular season records", () => {
    setupSeasons([{
      season: 2023,
      matchups: [
        matchup({ isPlayoffs: false, manager1: "Alice", points1: 100, manager2: "Bob", points2: 90 }),
        matchup({ isPlayoffs: true, week: 14, manager1: "Alice", points1: 120, manager2: "Bob", points2: 130 }),
      ],
    }]);

    const result = computeHeadToHead();
    const r = result[0];
    expect(r.totalGames).toBe(2);
    expect(r.regularSeason.wins).toBe(1);
    expect(r.regularSeason.losses).toBe(0);
    expect(r.regularSeason.games).toBe(1);
    expect(r.playoffs.wins).toBe(0);
    expect(r.playoffs.losses).toBe(1);
    expect(r.playoffs.games).toBe(1);
  });

  it("excludes consolation games", () => {
    setupSeasons([{
      season: 2023,
      matchups: [
        matchup({ isConsolation: true, manager1: "Alice", points1: 100, manager2: "Bob", points2: 90 }),
      ],
    }]);

    const result = computeHeadToHead();
    expect(result).toHaveLength(0);
  });

  it("excludes 0-0 matchups", () => {
    setupSeasons([{
      season: 2023,
      matchups: [matchup({ points1: 0, points2: 0 })],
    }]);

    const result = computeHeadToHead();
    expect(result).toHaveLength(0);
  });

  it("computes current streak with alternating wins", () => {
    setupSeasons([{
      season: 2023,
      matchups: [
        matchup({ week: 1, manager1: "Alice", points1: 110, manager2: "Bob", points2: 90 }),
        matchup({ week: 5, manager1: "Alice", points1: 80, manager2: "Bob", points2: 100 }),
        matchup({ week: 9, manager1: "Alice", points1: 70, manager2: "Bob", points2: 105 }),
      ],
    }]);

    const result = computeHeadToHead();
    const r = result[0];
    expect(r.currentStreak).toEqual({ manager: "Bob", count: 2 });
  });

  it("computes a single-game streak", () => {
    setupSeasons([{
      season: 2023,
      matchups: [
        matchup({ week: 1, manager1: "Alice", points1: 110, manager2: "Bob", points2: 90 }),
      ],
    }]);

    const result = computeHeadToHead();
    expect(result[0].currentStreak).toEqual({ manager: "Alice", count: 1 });
  });

  it("identifies biggest blowout and closest game", () => {
    setupSeasons([{
      season: 2023,
      matchups: [
        matchup({ week: 1, manager1: "Alice", points1: 150, manager2: "Bob", points2: 80 }),
        matchup({ week: 5, manager1: "Alice", points1: 95, manager2: "Bob", points2: 93 }),
      ],
    }]);

    const result = computeHeadToHead();
    const r = result[0];
    expect(r.regularSeason.biggestBlowout).toEqual({
      margin: 70,
      week: 1,
      year: 2023,
      winnerPoints: 150,
      loserPoints: 80,
    });
    expect(r.regularSeason.closestGame).toEqual({
      margin: 2,
      week: 5,
      year: 2023,
      winnerPoints: 95,
      loserPoints: 93,
    });
  });

  it("normalizes manager names via NAME_MAP", () => {
    setupSeasons([{
      season: 2023,
      matchups: [matchup({ manager1: "luke", points1: 100, manager2: "cody", points2: 90 })],
    }]);

    const result = computeHeadToHead();
    expect(result[0].manager1).toBe("Cody");
    expect(result[0].manager2).toBe("Luke");
  });

  it("sorts manager pair alphabetically in rivalry key", () => {
    setupSeasons([{
      season: 2023,
      matchups: [matchup({ manager1: "Zeke", points1: 100, manager2: "Alice", points2: 90 })],
    }]);

    const result = computeHeadToHead();
    expect(result[0].manager1).toBe("Alice");
    expect(result[0].manager2).toBe("Zeke");
    expect(result[0].regularSeason.wins).toBe(0);
    expect(result[0].regularSeason.losses).toBe(1);
  });

  it("accumulates records across multiple seasons", () => {
    setupSeasons([
      {
        season: 2022,
        matchups: [matchup({ week: 1, manager1: "Alice", points1: 110, manager2: "Bob", points2: 90 })],
      },
      {
        season: 2023,
        matchups: [matchup({ week: 1, manager1: "Alice", points1: 120, manager2: "Bob", points2: 100 })],
      },
    ]);

    const result = computeHeadToHead();
    const r = result[0];
    expect(r.totalGames).toBe(2);
    expect(r.regularSeason.wins).toBe(2);
    expect(r.regularSeason.pointsFor).toBe(230);
    expect(r.regularSeason.pointsAgainst).toBe(190);
  });

  it("sorts rivalries by total games descending", () => {
    setupSeasons([{
      season: 2023,
      matchups: [
        matchup({ week: 1, manager1: "Alice", points1: 100, manager2: "Bob", points2: 90 }),
        matchup({ week: 2, manager1: "Alice", points1: 100, manager2: "Bob", points2: 90 }),
        matchup({ week: 3, manager1: "Alice", points1: 100, manager2: "Bob", points2: 90 }),
        matchup({ week: 4, manager1: "Carol", points1: 80, manager2: "Dave", points2: 70 }),
      ],
    }]);

    const result = computeHeadToHead();
    expect(result[0].totalGames).toBe(3);
    expect(result[1].totalGames).toBe(1);
  });

  it("handles reversed manager order in raw data", () => {
    setupSeasons([{
      season: 2023,
      matchups: [
        matchup({ week: 1, manager1: "Bob", points1: 110, manager2: "Alice", points2: 90 }),
      ],
    }]);

    const result = computeHeadToHead();
    const r = result[0];
    expect(r.manager1).toBe("Alice");
    expect(r.manager2).toBe("Bob");
    expect(r.regularSeason.wins).toBe(0);
    expect(r.regularSeason.losses).toBe(1);
    expect(r.regularSeason.pointsFor).toBe(90);
    expect(r.regularSeason.pointsAgainst).toBe(110);
  });

  it("rounds margin to 2 decimal places", () => {
    setupSeasons([{
      season: 2023,
      matchups: [matchup({ points1: 100.123, points2: 99.456 })],
    }]);

    const result = computeHeadToHead();
    expect(result[0].regularSeason.biggestBlowout!.margin).toBe(0.67);
  });

  it("handles multiple rivalries independently", () => {
    setupSeasons([{
      season: 2023,
      matchups: [
        matchup({ manager1: "Alice", manager2: "Bob", points1: 100, points2: 90 }),
        matchup({ manager1: "Alice", manager2: "Carol", points1: 80, points2: 120, week: 2 }),
        matchup({ manager1: "Bob", manager2: "Carol", points1: 95, points2: 85, week: 3 }),
      ],
    }]);

    const result = computeHeadToHead();
    expect(result).toHaveLength(3);
  });
});

describe("getAllManagers", () => {
  it("returns empty array for empty rivalries", () => {
    expect(getAllManagers([])).toEqual([]);
  });

  it("extracts unique managers from rivalries", () => {
    const rivalries: Rivalry[] = [
      {
        manager1: "Alice",
        manager2: "Bob",
        totalGames: 1,
        regularSeason: { wins: 1, losses: 0, pointsFor: 100, pointsAgainst: 90, games: 1, biggestBlowout: null, closestGame: null },
        playoffs: { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, games: 0, biggestBlowout: null, closestGame: null },
        currentStreak: null,
      },
    ];
    expect(getAllManagers(rivalries)).toEqual(["Alice", "Bob"]);
  });

  it("deduplicates managers across multiple rivalries", () => {
    const base = {
      totalGames: 1,
      regularSeason: { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, games: 0, biggestBlowout: null, closestGame: null },
      playoffs: { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, games: 0, biggestBlowout: null, closestGame: null },
      currentStreak: null,
    };
    const rivalries: Rivalry[] = [
      { manager1: "Alice", manager2: "Bob", ...base },
      { manager1: "Alice", manager2: "Carol", ...base },
      { manager1: "Bob", manager2: "Carol", ...base },
    ];
    expect(getAllManagers(rivalries)).toEqual(["Alice", "Bob", "Carol"]);
  });

  it("sorts managers case-insensitively", () => {
    const base = {
      totalGames: 1,
      regularSeason: { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, games: 0, biggestBlowout: null, closestGame: null },
      playoffs: { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, games: 0, biggestBlowout: null, closestGame: null },
      currentStreak: null,
    };
    const rivalries: Rivalry[] = [
      { manager1: "bob", manager2: "Alice", ...base },
    ];
    const result = getAllManagers(rivalries);
    expect(result).toEqual(["Alice", "bob"]);
  });

  it("handles single rivalry", () => {
    const base = {
      totalGames: 5,
      regularSeason: { wins: 3, losses: 2, pointsFor: 500, pointsAgainst: 450, games: 5, biggestBlowout: null, closestGame: null },
      playoffs: { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, games: 0, biggestBlowout: null, closestGame: null },
      currentStreak: { manager: "Zeke", count: 2 },
    };
    const rivalries: Rivalry[] = [
      { manager1: "Zeke", manager2: "Alice", ...base },
    ];
    expect(getAllManagers(rivalries)).toEqual(["Alice", "Zeke"]);
  });
});
