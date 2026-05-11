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
  isKeeper?: boolean;
  keeperCost?: number | null;
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

// ── Position helpers ──────────────────────────────────────────────
const CORE_POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"] as const;
type CorePosition = (typeof CORE_POSITIONS)[number];

/** Map multi-position tags (QB,TE  WR,RB) to first listed position */
function normPos(raw: string): string {
  if (!raw) return "Unknown";
  if (CORE_POSITIONS.includes(raw as CorePosition)) return raw;
  const first = raw.split(",")[0].trim();
  return CORE_POSITIONS.includes(first as CorePosition) ? first : raw;
}

// ── Analytics types ──────────────────────────────────────────────

/** Average round of first pick at each position across drafts */
export interface DraftDNA {
  position: string;
  avgFirstRound: number;     // average round of first pick at this position
  firstPickRounds: number[]; // raw round values per year (for variance)
  yearsUsed: number;         // how many drafts included this position
}

/** Positional heatmap: count of picks per position per round */
export interface HeatmapCell {
  round: number;
  position: string;
  count: number;
}

/** Draft capital: where premium vs late picks go */
export interface DraftCapital {
  position: string;
  premiumPicks: number;  // rounds 1-5
  midPicks: number;      // rounds 6-10
  latePicks: number;     // rounds 11-16
}

/** Year-over-year positional evolution */
export interface EraBreakdown {
  era: string;
  years: number[];
  positionPcts: Record<string, number>;
  avgFirstPick: Record<string, number>;
}

/** Scouting report for a manager */
export interface ScoutingReport {
  archetype: string;
  archetypeDescription: string;
  strengths: string[];
  weaknesses: string[];
  recentPremiumPicks: { year: number; pick: DraftPick }[];
  finishHistory: { year: number; finish: string }[];
  championshipProbability: number;
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
  // Deep analytics
  draftDNA: DraftDNA[];
  styleNarrative: string;
  heatmap: HeatmapCell[];
  draftCapital: DraftCapital[];
  eraBreakdowns: EraBreakdown[];
  scoutingReport: ScoutingReport;
}

// ── Draft DNA computation ────────────────────────────────────────
function computeDraftDNA(draftsByYear: { year: number; picks: DraftPick[] }[]): DraftDNA[] {
  const posFirstRounds: Record<string, number[]> = {};
  for (const draft of draftsByYear) {
    const seenPos = new Set<string>();
    const sorted = [...draft.picks].sort((a, b) => a.round - b.round);
    for (const p of sorted) {
      const pos = normPos(p.position);
      if (!seenPos.has(pos)) {
        seenPos.add(pos);
        if (!posFirstRounds[pos]) posFirstRounds[pos] = [];
        posFirstRounds[pos].push(p.round);
      }
    }
  }
  return CORE_POSITIONS
    .filter((pos) => posFirstRounds[pos] && posFirstRounds[pos].length > 0)
    .map((pos) => {
      const rounds = posFirstRounds[pos];
      const avg = rounds.reduce((s, r) => s + r, 0) / rounds.length;
      return {
        position: pos,
        avgFirstRound: Math.round(avg * 10) / 10,
        firstPickRounds: rounds,
        yearsUsed: rounds.length,
      };
    })
    .sort((a, b) => a.avgFirstRound - b.avgFirstRound);
}

// ── Style narrative generation ───────────────────────────────────
function generateStyleNarrative(
  name: string,
  dna: DraftDNA[],
  nflTeams: Record<string, number>,
  totalDrafts: number,
): string {
  if (dna.length === 0 || totalDrafts === 0) return `${name} has limited draft history available.`;

  const earliest = dna[0];
  const latest = dna[dna.length - 1];

  // Find the QB timing
  const qbDNA = dna.find((d) => d.position === "QB");
  const rbDNA = dna.find((d) => d.position === "RB");
  const wrDNA = dna.find((d) => d.position === "WR");

  const parts: string[] = [];

  // Opening: primary archetype
  if (earliest.position === "RB" && earliest.avgFirstRound <= 2) {
    parts.push(`A running-back-first drafter who typically grabs an RB in round ${Math.round(earliest.avgFirstRound)}`);
  } else if (earliest.position === "WR" && earliest.avgFirstRound <= 2) {
    parts.push(`A wide-receiver-first drafter who typically locks in a WR in round ${Math.round(earliest.avgFirstRound)}`);
  } else if (earliest.position === "QB" && earliest.avgFirstRound <= 3) {
    parts.push(`An early-QB drafter who prioritizes the quarterback position in round ${Math.round(earliest.avgFirstRound)}`);
  } else if (rbDNA && wrDNA && Math.abs(rbDNA.avgFirstRound - wrDNA.avgFirstRound) <= 1) {
    parts.push(`A balanced drafter who targets both RBs and WRs early (both by round ${Math.max(Math.round(rbDNA.avgFirstRound), Math.round(wrDNA.avgFirstRound))})`);
  } else {
    parts.push(`Tends to prioritize ${earliest.position} early, typically grabbing one in round ${Math.round(earliest.avgFirstRound)}`);
  }

  // QB timing
  if (qbDNA) {
    if (qbDNA.avgFirstRound >= 9) {
      parts.push(`and waits until round ${Math.round(qbDNA.avgFirstRound)}+ for a quarterback`);
    } else if (qbDNA.avgFirstRound <= 3) {
      parts.push(`and values the QB position highly, taking one by round ${Math.round(qbDNA.avgFirstRound)}`);
    }
  }

  // TE timing
  const teDNA = dna.find((d) => d.position === "TE");
  if (teDNA && teDNA.avgFirstRound <= 4) {
    parts.push(`. Believes in the premium tight end, drafting one by round ${Math.round(teDNA.avgFirstRound)} on average`);
  }

  // Top NFL team
  const topTeams = Object.entries(nflTeams).sort((a, b) => b[1] - a[1]).slice(0, 2);
  if (topTeams.length >= 2) {
    parts.push(`. Historically favors ${topTeams[0][0]} and ${topTeams[1][0]} players`);
  }

  // Consistency
  if (totalDrafts >= 5 && earliest.firstPickRounds) {
    const variance = computeVariance(earliest.firstPickRounds);
    if (variance <= 1) {
      parts.push(`. Remarkably consistent in draft approach across ${totalDrafts} seasons`);
    } else if (variance >= 4) {
      parts.push(`. Tends to switch up strategy from year to year`);
    }
  }

  return parts.join("") + ".";
}

function computeVariance(nums: number[]): number {
  if (nums.length <= 1) return 0;
  const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
  const sq = nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length;
  return sq;
}

// ── Heatmap computation ──────────────────────────────────────────
function computeHeatmap(draftsByYear: { year: number; picks: DraftPick[] }[]): HeatmapCell[] {
  const counts: Record<string, number> = {};
  for (const draft of draftsByYear) {
    for (const p of draft.picks) {
      const pos = normPos(p.position);
      const key = `${p.round}:${pos}`;
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  const cells: HeatmapCell[] = [];
  for (const [key, count] of Object.entries(counts)) {
    const [round, position] = key.split(":");
    cells.push({ round: Number(round), position, count });
  }
  return cells.sort((a, b) => a.round - b.round || a.position.localeCompare(b.position));
}

// ── Draft capital computation ────────────────────────────────────
function computeDraftCapital(draftsByYear: { year: number; picks: DraftPick[] }[]): DraftCapital[] {
  const capital: Record<string, { premium: number; mid: number; late: number }> = {};
  for (const pos of CORE_POSITIONS) {
    capital[pos] = { premium: 0, mid: 0, late: 0 };
  }
  for (const draft of draftsByYear) {
    for (const p of draft.picks) {
      const pos = normPos(p.position);
      if (!capital[pos]) capital[pos] = { premium: 0, mid: 0, late: 0 };
      if (p.round <= 5) capital[pos].premium++;
      else if (p.round <= 10) capital[pos].mid++;
      else capital[pos].late++;
    }
  }
  return CORE_POSITIONS
    .filter((pos) => capital[pos] && (capital[pos].premium + capital[pos].mid + capital[pos].late) > 0)
    .map((pos) => ({
      position: pos,
      premiumPicks: capital[pos].premium,
      midPicks: capital[pos].mid,
      latePicks: capital[pos].late,
    }));
}

// ── Era breakdown computation ────────────────────────────────────
function computeEraBreakdowns(draftsByYear: { year: number; picks: DraftPick[] }[]): EraBreakdown[] {
  const sorted = [...draftsByYear].sort((a, b) => a.year - b.year);
  if (sorted.length < 4) return [];

  const eras: { label: string; years: number[]; picks: DraftPick[] }[] = [];
  const mid = Math.ceil(sorted.length / 2);
  const earlyDrafts = sorted.slice(0, mid);
  const recentDrafts = sorted.slice(mid);

  eras.push({
    label: `${earlyDrafts[0].year}–${earlyDrafts[earlyDrafts.length - 1].year}`,
    years: earlyDrafts.map((d) => d.year),
    picks: earlyDrafts.flatMap((d) => d.picks),
  });
  eras.push({
    label: `${recentDrafts[0].year}–${recentDrafts[recentDrafts.length - 1].year}`,
    years: recentDrafts.map((d) => d.year),
    picks: recentDrafts.flatMap((d) => d.picks),
  });

  return eras.map((era) => {
    const total = era.picks.length || 1;
    const posCounts: Record<string, number> = {};
    const posFirstRounds: Record<string, number[]> = {};

    for (const p of era.picks) {
      const pos = normPos(p.position);
      posCounts[pos] = (posCounts[pos] || 0) + 1;
    }

    // Compute avg first pick per position per year in this era
    for (const year of era.years) {
      const yearPicks = era.picks
        .filter((p) => {
          const d = draftsByYear.find(
            (dy) => dy.year === year && dy.picks.includes(p)
          );
          return !!d;
        })
        .sort((a, b) => a.round - b.round);
      // Instead, iterate era.picks directly grouped by year
    }
    // Simpler: get avg first round per position across era years
    for (const yearData of draftsByYear.filter((d) => era.years.includes(d.year))) {
      const seen = new Set<string>();
      const sorted2 = [...yearData.picks].sort((a, b) => a.round - b.round);
      for (const p of sorted2) {
        const pos = normPos(p.position);
        if (!seen.has(pos)) {
          seen.add(pos);
          if (!posFirstRounds[pos]) posFirstRounds[pos] = [];
          posFirstRounds[pos].push(p.round);
        }
      }
    }

    const positionPcts: Record<string, number> = {};
    const avgFirstPick: Record<string, number> = {};
    for (const pos of CORE_POSITIONS) {
      positionPcts[pos] = Math.round(((posCounts[pos] || 0) / total) * 100);
      const rounds = posFirstRounds[pos];
      if (rounds && rounds.length > 0) {
        avgFirstPick[pos] = Math.round((rounds.reduce((s, r) => s + r, 0) / rounds.length) * 10) / 10;
      }
    }

    return {
      era: era.label,
      years: era.years,
      positionPcts,
      avgFirstPick,
    };
  });
}

// ── Scouting report generation ───────────────────────────────────
function generateScoutingReport(
  name: string,
  dna: DraftDNA[],
  draftsByYear: { year: number; picks: DraftPick[] }[],
  championships: number,
  runnerUpYears: number[],
  thirdPlaceYears: number[],
  yearsActive: number[],
  history: SeasonRecord[],
): ScoutingReport {
  // Determine archetype
  const rbDNA = dna.find((d) => d.position === "RB");
  const wrDNA = dna.find((d) => d.position === "WR");
  const qbDNA = dna.find((d) => d.position === "QB");
  const teDNA = dna.find((d) => d.position === "TE");

  let archetype = "Balanced Drafter";
  let archetypeDescription = "No strong positional bias. Drafts based on value available.";

  if (dna.length > 0) {
    const first = dna[0];
    if (first.position === "RB" && first.avgFirstRound <= 2) {
      if (qbDNA && qbDNA.avgFirstRound >= 8) {
        archetype = "RB-Heavy, QB Punter";
        archetypeDescription = "Loads up on running backs early and streams quarterback late. Bet against them having a top QB.";
      } else {
        archetype = "RB-Heavy Early";
        archetypeDescription = "Prioritizes the running back position with premium capital. Expect RB in round 1.";
      }
    } else if (first.position === "WR" && first.avgFirstRound <= 2) {
      archetype = "WR-Heavy Early";
      archetypeDescription = "Prioritizes wide receivers with early picks. Will grab elite WR talent before RBs.";
    } else if (first.position === "QB" && first.avgFirstRound <= 3) {
      archetype = "Early QB Believer";
      archetypeDescription = "Invests premium draft capital in quarterback. Likely to reach for an elite QB.";
    } else if (teDNA && teDNA.avgFirstRound <= 4) {
      archetype = "TE Premium";
      archetypeDescription = "Values the tight end position highly. Will pay up for elite TE production.";
    } else if (rbDNA && wrDNA && Math.abs(rbDNA.avgFirstRound - wrDNA.avgFirstRound) <= 1.5) {
      archetype = "Balanced Drafter";
      archetypeDescription = "No strong positional bias in early rounds. Drafts best player available.";
    }
  }

  // Strengths & weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const d of dna) {
    if (d.avgFirstRound <= 3) {
      strengths.push(`Invests premium capital in ${d.position} (avg round ${d.avgFirstRound})`);
    }
    if (d.avgFirstRound >= 10 && d.position !== "K" && d.position !== "DEF") {
      weaknesses.push(`Neglects ${d.position} until round ${d.avgFirstRound} on average`);
    }
  }

  if (championships > 0) {
    strengths.push(`${championships}x champion, proven winner`);
  }
  const podiums = championships + runnerUpYears.length + thirdPlaceYears.length;
  if (podiums >= 3) {
    strengths.push(`Consistent contender with ${podiums} podium finishes`);
  }
  if (podiums === 0 && yearsActive.length >= 3) {
    weaknesses.push(`No podium finishes in ${yearsActive.length} seasons`);
  }

  // Recent premium picks (last 3 seasons, rounds 1-5)
  const recentYears = [...yearsActive].sort((a, b) => b - a).slice(0, 3);
  const recentPremiumPicks: { year: number; pick: DraftPick }[] = [];
  for (const year of recentYears) {
    const draft = draftsByYear.find((d) => d.year === year);
    if (draft) {
      for (const p of draft.picks.filter((pk) => pk.round <= 5)) {
        recentPremiumPicks.push({ year, pick: p });
      }
    }
  }
  recentPremiumPicks.sort((a, b) => b.year - a.year || a.pick.round - b.pick.round);

  // Finish history
  const finishHistory: { year: number; finish: string }[] = [];
  for (const year of yearsActive.sort((a, b) => b - a)) {
    const season = history.find((s) => s.year === year);
    if (!season) {
      finishHistory.push({ year, finish: "N/A" });
      continue;
    }
    const champName = normalizeManagerName(season.champion || "");
    const runnerName = normalizeManagerName(season.runnerUp || "");
    const thirdName = normalizeManagerName(season.third || "");
    if (champName.toLowerCase() === name.toLowerCase()) finishHistory.push({ year, finish: "1st" });
    else if (runnerName.toLowerCase() === name.toLowerCase()) finishHistory.push({ year, finish: "2nd" });
    else if (thirdName.toLowerCase() === name.toLowerCase()) finishHistory.push({ year, finish: "3rd" });
    else finishHistory.push({ year, finish: "N/A" });
  }

  // Championship probability: historical rate
  const totalSeasons = yearsActive.length || 1;
  const championshipProbability = Math.round((championships / totalSeasons) * 100);

  return {
    archetype,
    archetypeDescription,
    strengths,
    weaknesses,
    recentPremiumPicks,
    finishHistory,
    championshipProbability,
  };
}

// ── League-wide analytics ────────────────────────────────────────

export interface PositionByYearData {
  year: number;
  round1Pcts: Record<string, number>;
}

export interface ManagerArchetype {
  name: string;
  slug: string;
  archetype: string;
  draftDNA: DraftDNA[];
}

export interface NFLTeamPopularity {
  team: string;
  totalPicks: number;
  yearBreakdown: Record<number, number>;
}

export interface PositionScarcityData {
  position: string;
  avgLastRound: number;
  avgFirstRound: number;
  pickDistribution: { round: number; count: number }[];
}

export interface ChampionDraftProfile {
  year: number;
  champion: string;
  round1Position: string;
  positionBreakdown: Record<string, number>;
}

export interface KeeperByYear {
  year: number;
  keepers: number;
  fresh: number;
  total: number;
}

export interface LeagueAnalytics {
  positionByYear: PositionByYearData[];
  archetypes: ManagerArchetype[];
  nflTeamPopularity: NFLTeamPopularity[];
  positionScarcity: PositionScarcityData[];
  championProfiles: ChampionDraftProfile[];
  keepersByYear: KeeperByYear[];
  totalPicks: number;
  totalKeepers: number;
  totalDrafts: number;
  totalManagers: number;
}

export function computeLeagueAnalytics(): LeagueAnalytics {
  const drafts = loadAllDrafts();
  const history = (historyData as { seasons: SeasonRecord[] }).seasons;

  // 1. Position value over time (round 1 position breakdown by year)
  const positionByYear: PositionByYearData[] = [];
  for (const draft of drafts.sort((a, b) => a.year - b.year)) {
    const r1Picks = draft.picks.filter((p) => p.round === 1);
    const total = r1Picks.length || 1;
    const counts: Record<string, number> = {};
    for (const p of r1Picks) {
      const pos = normPos(p.position);
      counts[pos] = (counts[pos] || 0) + 1;
    }
    const pcts: Record<string, number> = {};
    for (const pos of CORE_POSITIONS) {
      pcts[pos] = Math.round(((counts[pos] || 0) / total) * 100);
    }
    positionByYear.push({ year: draft.year, round1Pcts: pcts });
  }

  // 2. Manager archetypes
  const allManagers = getAllManagerNames();
  const archetypes: ManagerArchetype[] = [];
  for (const mgrName of allManagers) {
    const mgrDrafts = drafts
      .map((d) => ({
        year: d.year,
        picks: d.picks.filter(
          (p) => normalizeManagerName(p.managerName).toLowerCase() === mgrName.toLowerCase()
        ),
      }))
      .filter((d) => d.picks.length > 0);

    if (mgrDrafts.length === 0) continue;
    const dna = computeDraftDNA(mgrDrafts);
    const report = generateScoutingReport(mgrName, dna, mgrDrafts, 0, [], [], [], []);
    archetypes.push({
      name: mgrName,
      slug: getManagerSlug(mgrName),
      archetype: report.archetype,
      draftDNA: dna,
    });
  }

  // 3. NFL team popularity
  const teamCounts: Record<string, Record<number, number>> = {};
  let totalPicks = 0;
  for (const draft of drafts) {
    for (const p of draft.picks) {
      totalPicks++;
      if (p.nflTeam) {
        if (!teamCounts[p.nflTeam]) teamCounts[p.nflTeam] = {};
        teamCounts[p.nflTeam][draft.year] = (teamCounts[p.nflTeam][draft.year] || 0) + 1;
      }
    }
  }
  const nflTeamPopularity: NFLTeamPopularity[] = Object.entries(teamCounts)
    .map(([team, yearBreakdown]) => ({
      team,
      totalPicks: Object.values(yearBreakdown).reduce((s, c) => s + c, 0),
      yearBreakdown,
    }))
    .sort((a, b) => b.totalPicks - a.totalPicks);

  // 4. Position scarcity
  const positionScarcity: PositionScarcityData[] = [];
  for (const pos of CORE_POSITIONS) {
    const roundCounts: Record<number, number> = {};
    const firstRounds: number[] = [];
    const lastRounds: number[] = [];

    for (const draft of drafts) {
      const posPicks = draft.picks
        .filter((p) => normPos(p.position) === pos)
        .sort((a, b) => a.round - b.round);
      if (posPicks.length > 0) {
        firstRounds.push(posPicks[0].round);
        lastRounds.push(posPicks[posPicks.length - 1].round);
      }
      for (const p of posPicks) {
        roundCounts[p.round] = (roundCounts[p.round] || 0) + 1;
      }
    }

    const pickDistribution = Object.entries(roundCounts)
      .map(([round, count]) => ({ round: Number(round), count }))
      .sort((a, b) => a.round - b.round);

    positionScarcity.push({
      position: pos,
      avgFirstRound:
        firstRounds.length > 0
          ? Math.round((firstRounds.reduce((s, r) => s + r, 0) / firstRounds.length) * 10) / 10
          : 0,
      avgLastRound:
        lastRounds.length > 0
          ? Math.round((lastRounds.reduce((s, r) => s + r, 0) / lastRounds.length) * 10) / 10
          : 0,
      pickDistribution,
    });
  }

  // 5. Champion draft profiles
  const championProfiles: ChampionDraftProfile[] = [];
  for (const season of history) {
    if (!season.champion) continue;
    const champName = normalizeManagerName(season.champion);
    const draft = drafts.find((d) => d.year === season.year);
    if (!draft) continue;
    const champPicks = draft.picks.filter(
      (p) => normalizeManagerName(p.managerName).toLowerCase() === champName.toLowerCase()
    );
    if (champPicks.length === 0) continue;

    const r1Pick = champPicks.find((p) => p.round === 1);
    const posCounts: Record<string, number> = {};
    for (const p of champPicks) {
      const pos = normPos(p.position);
      posCounts[pos] = (posCounts[pos] || 0) + 1;
    }

    championProfiles.push({
      year: season.year,
      champion: champName,
      round1Position: r1Pick ? normPos(r1Pick.position) : "N/A",
      positionBreakdown: posCounts,
    });
  }

  // Keeper stats by year
  const keepersByYear: KeeperByYear[] = drafts
    .map((d) => {
      const keepers = d.picks.filter((p) => p.isKeeper).length;
      return { year: d.year, keepers, fresh: d.picks.length - keepers, total: d.picks.length };
    })
    .sort((a, b) => a.year - b.year);
  const totalKeepers = keepersByYear.reduce((s, k) => s + k.keepers, 0);

  return {
    positionByYear,
    archetypes,
    nflTeamPopularity,
    positionScarcity,
    championProfiles,
    keepersByYear,
    totalPicks,
    totalKeepers,
    totalDrafts: drafts.length,
    totalManagers: allManagers.length,
  };
}

// ── Main profile builder ─────────────────────────────────────────

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
      // Position (normalized)
      const pos = normPos(p.position);
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

  // Deep analytics
  const draftDNA = computeDraftDNA(draftsByYear);
  const styleNarrative = generateStyleNarrative(name, draftDNA, nflTeamBreakdown, draftsByYear.length);
  const heatmap = computeHeatmap(draftsByYear);
  const draftCapital = computeDraftCapital(draftsByYear);
  const eraBreakdowns = computeEraBreakdowns(draftsByYear);
  const scoutingReport = generateScoutingReport(
    name, draftDNA, draftsByYear,
    championshipYears.length, runnerUpYears, thirdPlaceYears, yearsActive, history
  );

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
    draftDNA,
    styleNarrative,
    heatmap,
    draftCapital,
    eraBreakdowns,
    scoutingReport,
  };
}
