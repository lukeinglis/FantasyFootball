import historyData from "@/data/history.json";
import allTimeRecords from "@/data/all-time-records.json";

import season2015 from "@/data/seasons/2015.json";
import season2016 from "@/data/seasons/2016.json";
import season2017 from "@/data/seasons/2017.json";
import season2018 from "@/data/seasons/2018.json";
import season2019 from "@/data/seasons/2019.json";
import season2020 from "@/data/seasons/2020.json";
import season2021 from "@/data/seasons/2021.json";
import season2022 from "@/data/seasons/2022.json";
import season2023 from "@/data/seasons/2023.json";
import season2024 from "@/data/seasons/2024.json";
import season2025 from "@/data/seasons/2025.json";

export interface Champion {
  year: number;
  name: string;
  team: string;
}

export interface CoreAward {
  name: string;
  emoji: string;
  winner: string;
  team: string;
  stat: string;
  season: number;
  description: string;
}

export interface Superlative {
  name: string;
  emoji: string;
  winner: string;
  stat: string;
  description: string;
}

export function getChampions(): Champion[] {
  return historyData.seasons.map((s) => ({
    year: s.year,
    name: s.champion,
    team: s.championTeam,
  }));
}

export function getCoreAwards(): CoreAward[] {
  const r = allTimeRecords.allTime;
  return [
    {
      name: "The Hammer",
      emoji: "\u{1F528}",
      winner: r.mostPointsWeek.holder,
      team: r.mostPointsWeek.team,
      stat: `${r.mostPointsWeek.value} pts (Week ${r.mostPointsWeek.week})`,
      season: r.mostPointsWeek.season,
      description: r.mostPointsWeek.description,
    },
    {
      name: "The Mercy Rule",
      emoji: "\u{1F4A5}",
      winner: r.biggestBlowout.winner,
      team: r.biggestBlowout.winnerTeam,
      stat: `${r.biggestBlowout.score} (${r.biggestBlowout.margin} pt margin)`,
      season: r.biggestBlowout.season,
      description: r.biggestBlowout.description,
    },
    {
      name: "The Cardiac Arrest",
      emoji: "\u{1FAC0}",
      winner: r.closestGame.winner,
      team: r.closestGame.winnerTeam,
      stat: `${r.closestGame.score} (${r.closestGame.margin} pt margin)`,
      season: r.closestGame.season,
      description: r.closestGame.description,
    },
    {
      name: "The Unstoppable",
      emoji: "\u{1F525}",
      winner: r.longestWinStreak.holder,
      team: r.longestWinStreak.team,
      stat: `${r.longestWinStreak.value} consecutive wins`,
      season: r.longestWinStreak.season,
      description: r.longestWinStreak.description,
    },
    {
      name: "The Iron Throne",
      emoji: "\u{1F451}",
      winner: r.bestRecord.holder,
      team: r.bestRecord.team,
      stat: r.bestRecord.value,
      season: r.bestRecord.season,
      description: r.bestRecord.description,
    },
    {
      name: "The Goose Egg",
      emoji: "\u{1F95A}",
      winner: r.fewestPointsWeek.holder,
      team: r.fewestPointsWeek.team,
      stat: `${r.fewestPointsWeek.value} pts (Week ${r.fewestPointsWeek.week})`,
      season: r.fewestPointsWeek.season,
      description: r.fewestPointsWeek.description,
    },
  ];
}

interface SeasonFile {
  season: number;
  playoffStart: string;
  matchups: {
    week: number;
    isPlayoffs: boolean;
    isConsolation: boolean;
    manager1: string;
    points1: number;
    manager2: string;
    points2: number;
  }[];
}

const ALL_SEASONS: SeasonFile[] = [
  season2015 as SeasonFile,
  season2016 as SeasonFile,
  season2017 as SeasonFile,
  season2018 as SeasonFile,
  season2019 as SeasonFile,
  season2020 as SeasonFile,
  season2021 as SeasonFile,
  season2022 as SeasonFile,
  season2023 as SeasonFile,
  season2024 as SeasonFile,
  season2025 as SeasonFile,
];

interface ManagerWeeklyScores {
  [manager: string]: number[];
}

function getRegularSeasonScores(): ManagerWeeklyScores {
  const scores: ManagerWeeklyScores = {};

  for (const season of ALL_SEASONS) {
    const playoffStart = parseInt(season.playoffStart, 10);

    for (const m of season.matchups) {
      if (m.week >= playoffStart) continue;

      if (!scores[m.manager1]) scores[m.manager1] = [];
      scores[m.manager1].push(m.points1);

      if (!scores[m.manager2]) scores[m.manager2] = [];
      scores[m.manager2].push(m.points2);
    }
  }

  return scores;
}

function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sqDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / values.length);
}

interface LuckRecord {
  manager: string;
  luckyWins: number;
  totalGames: number;
}

function computeLuck(): LuckRecord[] {
  const luck: Record<string, { lucky: number; total: number }> = {};

  for (const season of ALL_SEASONS) {
    const playoffStart = parseInt(season.playoffStart, 10);

    const weekGroups: Record<number, { manager: string; points: number; won: boolean }[]> = {};

    for (const m of season.matchups) {
      if (m.week >= playoffStart) continue;

      if (!weekGroups[m.week]) weekGroups[m.week] = [];
      weekGroups[m.week].push(
        { manager: m.manager1, points: m.points1, won: m.points1 > m.points2 },
        { manager: m.manager2, points: m.points2, won: m.points2 > m.points1 }
      );
    }

    for (const entries of Object.values(weekGroups)) {
      const allScores = entries.map((e) => e.points).sort((a, b) => a - b);
      const medianIdx = Math.floor(allScores.length / 2);
      const median =
        allScores.length % 2 === 0
          ? (allScores[medianIdx - 1] + allScores[medianIdx]) / 2
          : allScores[medianIdx];

      for (const entry of entries) {
        if (!luck[entry.manager]) luck[entry.manager] = { lucky: 0, total: 0 };
        luck[entry.manager].total++;
        if (entry.won && entry.points < median) {
          luck[entry.manager].lucky++;
        }
      }
    }
  }

  return Object.entries(luck)
    .map(([manager, data]) => ({
      manager,
      luckyWins: data.lucky,
      totalGames: data.total,
    }))
    .sort((a, b) => b.luckyWins - a.luckyWins);
}

export function computeSuperlatives(): Superlative[] {
  const scores = getRegularSeasonScores();
  const luckRecords = computeLuck();

  const luckiest = luckRecords[0];

  const deviations = Object.entries(scores)
    .map(([manager, vals]) => ({ manager, sd: stddev(vals), games: vals.length }))
    .filter((d) => d.games >= 13);

  deviations.sort((a, b) => a.sd - b.sd);
  const mostConsistent = deviations[0];

  deviations.sort((a, b) => b.sd - a.sd);
  const mostVolatile = deviations[0];

  return [
    {
      name: "Horseshoe Award",
      emoji: "\u{1F340}",
      winner: luckiest.manager,
      stat: `${luckiest.luckyWins} wins below league median`,
      description: "Most wins when scoring below the weekly league median",
    },
    {
      name: "The Metronome",
      emoji: "\u{23F1}\u{FE0F}",
      winner: mostConsistent.manager,
      stat: `${mostConsistent.sd.toFixed(1)} pt std dev`,
      description: "Most consistent weekly scorer (lowest standard deviation)",
    },
    {
      name: "The Roller Coaster",
      emoji: "\u{1F3A2}",
      winner: mostVolatile.manager,
      stat: `${mostVolatile.sd.toFixed(1)} pt std dev`,
      description: "Most boom-or-bust weekly scorer (highest standard deviation)",
    },
  ];
}
