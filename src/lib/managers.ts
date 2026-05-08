import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import membersData from "@/data/members.json";
import historyData from "@/data/history.json";

interface DraftPick {
  pick: number;
  round: number;
  teamKey: string;
  teamName: string;
  managerName: string;
  playerKey: string;
  playerName: string;
  position: string;
  nflTeam: string;
}

interface SeasonDraft {
  year: number;
  picks: DraftPick[];
  teams: { teamKey: string; teamName: string; managerName: string }[];
}

interface SeasonRecord {
  year: number;
  champion?: string;
  championTeam?: string;
  runnerUp?: string;
  runnerUpTeam?: string;
  third?: string;
  thirdTeam?: string;
}

// Canonical name mapping: raw draft name -> display name
const NAME_MAP: Record<string, string> = {
  luke: "Luke",
  cody: "Cody",
  "Kyle V": "Kyle",
  JohnH: "John",
};

export function normalizeManagerName(raw: string): string {
  return NAME_MAP[raw] || raw;
}

export function getManagerSlug(name: string): string {
  return encodeURIComponent(normalizeManagerName(name).toLowerCase());
}

export function slugToName(slug: string): string {
  const decoded = decodeURIComponent(slug).toLowerCase();
  const all = getAllManagerNames();
  return all.find((n) => n.toLowerCase() === decoded) || decoded;
}

export function loadAllDrafts(): SeasonDraft[] {
  const dir = join(process.cwd(), "src", "data", "drafts");
  try {
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();
    return files.map((f) => {
      const raw = readFileSync(join(dir, f), "utf-8");
      return JSON.parse(raw) as SeasonDraft;
    });
  } catch {
    return [];
  }
}

export function getAllManagerNames(): string[] {
  const drafts = loadAllDrafts();
  const names = new Set<string>();
  for (const d of drafts) {
    for (const p of d.picks) {
      if (p.managerName) names.add(normalizeManagerName(p.managerName));
    }
  }
  // Also add from members.json
  const members = membersData as { active: { name: string }[]; emeritus: { name: string }[] };
  for (const m of [...members.active, ...members.emeritus]) {
    names.add(m.name);
  }
  return [...names].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

export interface ManagerProfile {
  name: string;
  slug: string;
  currentTeamName: string | null;
  isActive: boolean;
  isEmeritus: boolean;
  yearsActive: number[];
  totalPicks: number;
  championships: number;
  championshipYears: number[];
  runnerUpYears: number[];
  thirdPlaceYears: number[];
  teamNames: { year: number; teamName: string }[];
  positionBreakdown: Record<string, number>;
  nflTeamBreakdown: Record<string, number>;
  picksByRound: { round: number; avgPick: number; count: number }[];
  draftsByYear: { year: number; picks: DraftPick[] }[];
  firstRoundPicks: DraftPick[];
}

export function buildManagerProfile(name: string): ManagerProfile | null {
  const drafts = loadAllDrafts();
  const history = (historyData as { seasons: SeasonRecord[] }).seasons;
  const members = membersData as { active: { name: string; teamName: string }[]; emeritus: { name: string; teamName: string }[] };

  const activeMember = members.active.find(
    (m) => m.name.toLowerCase() === name.toLowerCase()
  );
  const emeritusMember = members.emeritus.find(
    (m) => m.name.toLowerCase() === name.toLowerCase()
  );

  // Gather all picks for this manager across all seasons
  const draftsByYear: { year: number; picks: DraftPick[] }[] = [];
  const teamNames: { year: number; teamName: string }[] = [];
  const yearsActive: number[] = [];
  let totalPicks = 0;
  const positionBreakdown: Record<string, number> = {};
  const nflTeamBreakdown: Record<string, number> = {};
  const roundPicks: Record<number, { total: number; count: number }> = {};
  const firstRoundPicks: DraftPick[] = [];

  for (const draft of drafts) {
    const myPicks = draft.picks.filter(
      (p) => normalizeManagerName(p.managerName).toLowerCase() === name.toLowerCase()
    );

    if (myPicks.length === 0) continue;

    yearsActive.push(draft.year);
    draftsByYear.push({ year: draft.year, picks: myPicks });
    totalPicks += myPicks.length;

    // Team name for this season
    const tn = myPicks[0]?.teamName;
    if (tn) teamNames.push({ year: draft.year, teamName: tn });

    for (const p of myPicks) {
      // Position
      const pos = p.position || "Unknown";
      positionBreakdown[pos] = (positionBreakdown[pos] || 0) + 1;

      // NFL team
      if (p.nflTeam) {
        nflTeamBreakdown[p.nflTeam] = (nflTeamBreakdown[p.nflTeam] || 0) + 1;
      }

      // Round stats
      if (!roundPicks[p.round]) roundPicks[p.round] = { total: 0, count: 0 };
      roundPicks[p.round].total += p.pick;
      roundPicks[p.round].count++;

      // First round
      if (p.round === 1) firstRoundPicks.push(p);
    }
  }

  if (yearsActive.length === 0 && !activeMember && !emeritusMember) return null;

  // Season results
  const championshipYears: number[] = [];
  const runnerUpYears: number[] = [];
  const thirdPlaceYears: number[] = [];

  for (const s of history) {
    const champName = normalizeManagerName(s.champion || "");
    const runnerName = normalizeManagerName(s.runnerUp || "");
    const thirdName = normalizeManagerName(s.third || "");
    if (champName.toLowerCase() === name.toLowerCase()) championshipYears.push(s.year);
    if (runnerName.toLowerCase() === name.toLowerCase()) runnerUpYears.push(s.year);
    if (thirdName.toLowerCase() === name.toLowerCase()) thirdPlaceYears.push(s.year);
  }

  const picksByRound = Object.entries(roundPicks)
    .map(([r, data]) => ({
      round: Number(r),
      avgPick: Math.round(data.total / data.count),
      count: data.count,
    }))
    .sort((a, b) => a.round - b.round);

  return {
    name,
    slug: getManagerSlug(name),
    currentTeamName: activeMember?.teamName || emeritusMember?.teamName || teamNames[0]?.teamName || null,
    isActive: !!activeMember,
    isEmeritus: !!emeritusMember,
    yearsActive: yearsActive.sort((a, b) => b - a),
    totalPicks,
    championships: championshipYears.length,
    championshipYears,
    runnerUpYears,
    thirdPlaceYears,
    teamNames: teamNames.sort((a, b) => b.year - a.year),
    positionBreakdown,
    nflTeamBreakdown,
    picksByRound,
    draftsByYear: draftsByYear.sort((a, b) => b.year - a.year),
    firstRoundPicks: firstRoundPicks.sort((a, b) => b.pick - a.pick),
  };
}
