import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { normalizeManagerName } from "@/lib/managers";

interface Matchup {
  week: number;
  isPlayoffs: boolean;
  isConsolation: boolean;
  team1: string;
  manager1: string;
  points1: number;
  team2: string;
  manager2: string;
  points2: number;
}

interface SeasonData {
  season: number;
  matchups: Matchup[];
}

export interface GameDetail {
  margin: number;
  week: number;
  year: number;
  winnerPoints: number;
  loserPoints: number;
}

export interface RivalryRecord {
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  games: number;
  biggestBlowout: GameDetail | null;
  closestGame: GameDetail | null;
}

export interface Rivalry {
  manager1: string;
  manager2: string;
  totalGames: number;
  regularSeason: RivalryRecord;
  playoffs: RivalryRecord;
  currentStreak: { manager: string; count: number } | null;
}

function makeKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

function emptyRecord(): RivalryRecord {
  return {
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    games: 0,
    biggestBlowout: null,
    closestGame: null,
  };
}

function loadAllSeasons(): SeasonData[] {
  const dir = join(process.cwd(), "src", "data", "seasons");
  try {
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort();
    return files.map((f) => {
      const raw = readFileSync(join(dir, f), "utf-8");
      return JSON.parse(raw) as SeasonData;
    });
  } catch {
    return [];
  }
}

function updateRecord(
  record: RivalryRecord,
  ptsFor: number,
  ptsAgainst: number,
  week: number,
  year: number,
): void {
  record.games++;
  record.pointsFor += ptsFor;
  record.pointsAgainst += ptsAgainst;
  if (ptsFor > ptsAgainst) {
    record.wins++;
  } else {
    record.losses++;
  }
  const margin = Math.abs(ptsFor - ptsAgainst);
  const detail: GameDetail = {
    margin: Math.round(margin * 100) / 100,
    week,
    year,
    winnerPoints: Math.max(ptsFor, ptsAgainst),
    loserPoints: Math.min(ptsFor, ptsAgainst),
  };
  if (!record.biggestBlowout || margin > record.biggestBlowout.margin) {
    record.biggestBlowout = detail;
  }
  if (!record.closestGame || margin < record.closestGame.margin) {
    record.closestGame = detail;
  }
}

export function computeHeadToHead(): Rivalry[] {
  const seasons = loadAllSeasons();

  const rivalryMap = new Map<
    string,
    {
      manager1: string;
      manager2: string;
      regularSeason: { m1: RivalryRecord; m2: RivalryRecord };
      playoffs: { m1: RivalryRecord; m2: RivalryRecord };
      streakHistory: string[];
    }
  >();

  for (const season of seasons) {
    for (const m of season.matchups) {
      if (m.isConsolation) continue;
      if (m.points1 === 0 && m.points2 === 0) continue;

      const mgr1 = normalizeManagerName(m.manager1);
      const mgr2 = normalizeManagerName(m.manager2);
      const key = makeKey(mgr1, mgr2);
      const [sortedA, sortedB] = [mgr1, mgr2].sort();

      if (!rivalryMap.has(key)) {
        rivalryMap.set(key, {
          manager1: sortedA,
          manager2: sortedB,
          regularSeason: { m1: emptyRecord(), m2: emptyRecord() },
          playoffs: { m1: emptyRecord(), m2: emptyRecord() },
          streakHistory: [],
        });
      }

      const rivalry = rivalryMap.get(key)!;
      const isM1First = mgr1 === sortedA;
      const bucket = m.isPlayoffs ? rivalry.playoffs : rivalry.regularSeason;

      if (isM1First) {
        updateRecord(bucket.m1, m.points1, m.points2, m.week, season.season);
        updateRecord(bucket.m2, m.points2, m.points1, m.week, season.season);
      } else {
        updateRecord(bucket.m1, m.points2, m.points1, m.week, season.season);
        updateRecord(bucket.m2, m.points1, m.points2, m.week, season.season);
      }

      const winner =
        m.points1 > m.points2
          ? (isM1First ? sortedA : sortedB)
          : (isM1First ? sortedB : sortedA);
      rivalry.streakHistory.push(winner);
    }
  }

  const rivalries: Rivalry[] = [];
  for (const [, data] of rivalryMap) {
    const totalGames =
      data.regularSeason.m1.games + data.playoffs.m1.games;
    if (totalGames === 0) continue;

    let currentStreak: { manager: string; count: number } | null = null;
    if (data.streakHistory.length > 0) {
      const last = data.streakHistory[data.streakHistory.length - 1];
      let count = 0;
      for (let i = data.streakHistory.length - 1; i >= 0; i--) {
        if (data.streakHistory[i] === last) count++;
        else break;
      }
      currentStreak = { manager: last, count };
    }

    rivalries.push({
      manager1: data.manager1,
      manager2: data.manager2,
      totalGames,
      regularSeason: data.regularSeason.m1,
      playoffs: data.playoffs.m1,
      currentStreak,
    });
  }

  rivalries.sort((a, b) => b.totalGames - a.totalGames);
  return rivalries;
}

export function getAllManagers(rivalries: Rivalry[]): string[] {
  const set = new Set<string>();
  for (const r of rivalries) {
    set.add(r.manager1);
    set.add(r.manager2);
  }
  return [...set].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  );
}
