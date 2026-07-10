import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { normalizeManagerName, getManagerSlug, slugToName } from "@/lib/managers";
import membersData from "@/data/members.json";
import historyData from "@/data/history.json";
import allTimeRecords from "@/data/all-time-records.json";

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

interface SeasonFile {
  season: number;
  endWeek: string;
  playoffStart: string;
  matchups: Matchup[];
}

interface HistorySeason {
  year: number;
  champion?: string;
  championTeam?: string;
  runnerUp?: string;
  runnerUpTeam?: string;
  third?: string;
  thirdTeam?: string;
  milestones?: string[];
}

interface SeasonStanding {
  managerName: string;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  season: number;
  rank: number;
}

export interface ManagerCareerStats {
  name: string;
  slug: string;
  isActive: boolean;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  totalPointsFor: number;
  totalPointsAgainst: number;
  seasonsPlayed: number;
  championships: number;
  championshipYears: number[];
  runnerUpYears: number[];
  teamName: string;
}

export interface PersonalRecord {
  label: string;
  value: number;
  detail: string;
}

export interface ManagerPersonalRecords {
  highestWeekScore: PersonalRecord | null;
  lowestWeekScore: PersonalRecord | null;
  biggestWinMargin: PersonalRecord | null;
  closestLoss: PersonalRecord | null;
  longestWinStreak: PersonalRecord | null;
  longestLossStreak: PersonalRecord | null;
}

export type PlayoffResult = "Champion" | "Runner-up" | "3rd Place" | "Playoffs" | "Did not qualify";

export interface SeasonBreakdown {
  year: number;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  rank: number;
  playoffResult: PlayoffResult;
}

let cachedSeasons: SeasonFile[] | null = null;

function loadSeasonFiles(): SeasonFile[] {
  if (cachedSeasons) return cachedSeasons;
  const dir = join(process.cwd(), "src", "data", "seasons");
  try {
    const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
    cachedSeasons = files.map((f) => {
      const raw = readFileSync(join(dir, f), "utf-8");
      return JSON.parse(raw) as SeasonFile;
    });
    return cachedSeasons;
  } catch {
    return [];
  }
}

function nameMatch(a: string, b: string): boolean {
  return normalizeManagerName(a).toLowerCase() === normalizeManagerName(b).toLowerCase();
}

const history = historyData as { seasons: HistorySeason[] };
const standings = allTimeRecords.seasonStandings as SeasonStanding[];
const members = membersData as {
  active: { name: string; teamName: string }[];
  emeritus: { name: string; teamName: string }[];
};

export function getAllManagerSlugs(): string[] {
  const names = new Set<string>();
  for (const m of [...members.active, ...members.emeritus]) {
    names.add(m.name);
  }
  for (const s of standings) {
    names.add(normalizeManagerName(s.managerName));
  }
  return [...names]
    .map((n) => getManagerSlug(n))
    .filter((slug, i, arr) => arr.indexOf(slug) === i)
    .sort();
}

export function getManagerCareerStats(slug: string): ManagerCareerStats | null {
  const name = slugToName(slug);
  const activeMember = members.active.find((m) => nameMatch(m.name, name));
  const emeritusMember = members.emeritus.find((m) => nameMatch(m.name, name));

  const managerStandings = standings.filter((s) => nameMatch(s.managerName, name));

  if (managerStandings.length === 0 && !activeMember && !emeritusMember) {
    return null;
  }

  let wins = 0;
  let losses = 0;
  let ties = 0;
  let totalPF = 0;
  let totalPA = 0;

  for (const s of managerStandings) {
    wins += s.wins;
    losses += s.losses;
    ties += s.ties;
    totalPF += s.pointsFor;
    totalPA += s.pointsAgainst;
  }

  const totalGames = wins + losses + ties;
  const winPct = totalGames > 0 ? Math.round((wins / totalGames) * 1000) / 10 : 0;

  const championshipYears: number[] = [];
  const runnerUpYears: number[] = [];
  for (const s of history.seasons) {
    if (s.champion && nameMatch(s.champion, name)) championshipYears.push(s.year);
    if (s.runnerUp && nameMatch(s.runnerUp, name)) runnerUpYears.push(s.year);
  }

  const displayName = activeMember?.name || emeritusMember?.name || normalizeManagerName(name);
  const teamName = activeMember?.teamName || emeritusMember?.teamName || managerStandings[0]?.teamName || "";

  return {
    name: displayName,
    slug,
    isActive: !!activeMember,
    wins,
    losses,
    ties,
    winPct,
    totalPointsFor: Math.round(totalPF * 100) / 100,
    totalPointsAgainst: Math.round(totalPA * 100) / 100,
    seasonsPlayed: managerStandings.length > 0
      ? new Set(managerStandings.map((s) => s.season)).size
      : 0,
    championships: championshipYears.length,
    championshipYears,
    runnerUpYears,
    teamName,
  };
}

export function getManagerPersonalRecords(slug: string): ManagerPersonalRecords {
  const name = slugToName(slug);
  const seasons = loadSeasonFiles();

  let highestWeek: PersonalRecord | null = null;
  let lowestWeek: PersonalRecord | null = null;
  let biggestWin: PersonalRecord | null = null;
  let closestLoss: PersonalRecord | null = null;

  let currentWinStreak = 0;
  let maxWinStreak = 0;
  let winStreakDetail = "";
  let currentLossStreak = 0;
  let maxLossStreak = 0;
  let lossStreakDetail = "";

  for (const season of seasons) {
    const regularMatchups = season.matchups
      .filter((m) => !m.isPlayoffs)
      .sort((a, b) => a.week - b.week);

    for (const m of regularMatchups) {
      let myPoints = 0;
      let oppPoints = 0;
      let isManager = false;

      if (nameMatch(m.manager1, name)) {
        myPoints = m.points1;
        oppPoints = m.points2;
        isManager = true;
      } else if (nameMatch(m.manager2, name)) {
        myPoints = m.points2;
        oppPoints = m.points1;
        isManager = true;
      }

      if (!isManager) continue;

      const weekLabel = `Week ${m.week}, ${season.season}`;

      if (highestWeek === null || myPoints > highestWeek.value) {
        highestWeek = { label: "Highest Weekly Score", value: myPoints, detail: weekLabel };
      }
      if (lowestWeek === null || myPoints < lowestWeek.value) {
        lowestWeek = { label: "Lowest Weekly Score", value: myPoints, detail: weekLabel };
      }

      const margin = myPoints - oppPoints;

      if (margin > 0) {
        if (biggestWin === null || margin > biggestWin.value) {
          biggestWin = { label: "Biggest Win Margin", value: Math.round(margin * 100) / 100, detail: weekLabel };
        }
        currentWinStreak++;
        currentLossStreak = 0;
        if (currentWinStreak > maxWinStreak) {
          maxWinStreak = currentWinStreak;
          winStreakDetail = `${season.season}`;
        }
      } else if (margin < 0) {
        if (closestLoss === null || Math.abs(margin) < closestLoss.value) {
          closestLoss = { label: "Closest Loss", value: Math.round(Math.abs(margin) * 100) / 100, detail: weekLabel };
        }
        currentLossStreak++;
        currentWinStreak = 0;
        if (currentLossStreak > maxLossStreak) {
          maxLossStreak = currentLossStreak;
          lossStreakDetail = `${season.season}`;
        }
      } else {
        currentWinStreak = 0;
        currentLossStreak = 0;
      }
    }
  }

  return {
    highestWeekScore: highestWeek,
    lowestWeekScore: lowestWeek,
    biggestWinMargin: biggestWin,
    closestLoss,
    longestWinStreak: maxWinStreak > 0
      ? { label: "Longest Win Streak", value: maxWinStreak, detail: winStreakDetail }
      : null,
    longestLossStreak: maxLossStreak > 0
      ? { label: "Longest Loss Streak", value: maxLossStreak, detail: lossStreakDetail }
      : null,
  };
}

export function getManagerSeasonBreakdowns(slug: string): SeasonBreakdown[] {
  const name = slugToName(slug);

  const managerStandings = standings.filter((s) => nameMatch(s.managerName, name));

  const seasons = loadSeasonFiles();

  return managerStandings
    .map((s) => {
      let playoffResult: PlayoffResult = "Did not qualify";

      const seasonFile = seasons.find((sf) => sf.season === s.season);
      if (seasonFile) {
        const playoffMatchups = seasonFile.matchups.filter(
          (m) => m.isPlayoffs && !m.isConsolation &&
            (nameMatch(m.manager1, name) || nameMatch(m.manager2, name))
        );

        if (playoffMatchups.length > 0) {
          const champSeason = history.seasons.find((h) => h.year === s.season);
          if (champSeason?.champion && nameMatch(champSeason.champion, name)) {
            playoffResult = "Champion";
          } else if (champSeason?.runnerUp && nameMatch(champSeason.runnerUp, name)) {
            playoffResult = "Runner-up";
          } else if (champSeason?.third && nameMatch(champSeason.third, name)) {
            playoffResult = "3rd Place";
          } else {
            playoffResult = "Playoffs";
          }
        }
      }

      return {
        year: s.season,
        teamName: s.teamName,
        wins: s.wins,
        losses: s.losses,
        ties: s.ties,
        pointsFor: s.pointsFor,
        pointsAgainst: s.pointsAgainst,
        rank: s.rank,
        playoffResult,
      };
    })
    .sort((a, b) => b.year - a.year);
}
