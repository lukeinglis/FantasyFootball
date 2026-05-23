import { loadAllDrafts, normalizeManagerName, getAllManagerNames, getManagerSlug } from "@/lib/managers";
import logger from "@/lib/logger";

const SKILL_POSITIONS = ["QB", "RB", "WR", "TE"] as const;
type SkillPosition = (typeof SKILL_POSITIONS)[number];

function normPos(raw: string): string {
  if (!raw) return "Unknown";
  const ALL = ["QB", "RB", "WR", "TE", "K", "DEF"] as const;
  if ((ALL as readonly string[]).includes(raw)) return raw;
  const first = raw.split(",")[0].trim();
  return (ALL as readonly string[]).includes(first) ? first : raw;
}

export interface ManagerDraftStyle {
  name: string;
  slug: string;
  seasonsCount: number;
  avgRounds: Record<string, number>;
  earliestPosition: string;
  latestPosition: string;
  positionCounts: Record<string, number>;
  totalPicks: number;
}

export interface DraftValuePick {
  year: number;
  managerName: string;
  playerName: string;
  position: string;
  round: number;
  pick: number;
  positionAvgRound: number;
  valueDelta: number;
}

export interface PositionTrend {
  year: number;
  positionShares: Record<string, number>;
  avgRoundByPosition: Record<string, number>;
  totalPicks: number;
}

export interface DraftTrendsData {
  trends: PositionTrend[];
  styles: ManagerDraftStyle[];
  bestValues: DraftValuePick[];
  worstValues: DraftValuePick[];
  totalSeasons: number;
  totalPicks: number;
}

export function computeDraftTrends(): DraftTrendsData {
  logger.info("computing draft trends");
  const drafts = loadAllDrafts();

  const trends: PositionTrend[] = [];
  let totalPicks = 0;

  const posAvgRoundGlobal: Record<string, { sum: number; count: number }> = {};

  for (const draft of drafts.sort((a, b) => a.year - b.year)) {
    const posCounts: Record<string, number> = {};
    const posRoundSums: Record<string, { sum: number; count: number }> = {};

    for (const p of draft.picks) {
      const pos = normPos(p.position);
      posCounts[pos] = (posCounts[pos] || 0) + 1;
      if (!posRoundSums[pos]) posRoundSums[pos] = { sum: 0, count: 0 };
      posRoundSums[pos].sum += p.round;
      posRoundSums[pos].count += 1;

      if (!posAvgRoundGlobal[pos]) posAvgRoundGlobal[pos] = { sum: 0, count: 0 };
      posAvgRoundGlobal[pos].sum += p.round;
      posAvgRoundGlobal[pos].count += 1;
    }

    const total = draft.picks.length || 1;
    totalPicks += draft.picks.length;

    const positionShares: Record<string, number> = {};
    const avgRoundByPosition: Record<string, number> = {};

    for (const pos of SKILL_POSITIONS) {
      positionShares[pos] = Math.round(((posCounts[pos] || 0) / total) * 100);
      if (posRoundSums[pos] && posRoundSums[pos].count > 0) {
        avgRoundByPosition[pos] = Math.round(
          (posRoundSums[pos].sum / posRoundSums[pos].count) * 10
        ) / 10;
      }
    }

    trends.push({
      year: draft.year,
      positionShares,
      avgRoundByPosition,
      totalPicks: draft.picks.length,
    });
  }

  return {
    trends,
    styles: getManagerDraftStyles(),
    ...getDraftValuePicks(),
    totalSeasons: drafts.length,
    totalPicks,
  };
}

function getManagerDraftStyles(): ManagerDraftStyle[] {
  const drafts = loadAllDrafts();
  const allManagers = getAllManagerNames();
  const styles: ManagerDraftStyle[] = [];

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

    const posRoundData: Record<string, { sum: number; count: number }> = {};
    const posCounts: Record<string, number> = {};
    let totalPicks = 0;

    for (const draft of mgrDrafts) {
      const seenInDraft = new Set<string>();
      const sorted = [...draft.picks].sort((a, b) => a.round - b.round);

      for (const p of sorted) {
        const pos = normPos(p.position);
        posCounts[pos] = (posCounts[pos] || 0) + 1;
        totalPicks++;

        if (!seenInDraft.has(pos)) {
          seenInDraft.add(pos);
          if (!posRoundData[pos]) posRoundData[pos] = { sum: 0, count: 0 };
          posRoundData[pos].sum += p.round;
          posRoundData[pos].count += 1;
        }
      }
    }

    const avgRounds: Record<string, number> = {};
    let earliestPos = "";
    let earliestAvg = Infinity;
    let latestPos = "";
    let latestAvg = 0;

    for (const pos of SKILL_POSITIONS) {
      if (posRoundData[pos] && posRoundData[pos].count > 0) {
        const avg = Math.round((posRoundData[pos].sum / posRoundData[pos].count) * 10) / 10;
        avgRounds[pos] = avg;
        if (avg < earliestAvg) {
          earliestAvg = avg;
          earliestPos = pos;
        }
        if (avg > latestAvg) {
          latestAvg = avg;
          latestPos = pos;
        }
      }
    }

    styles.push({
      name: mgrName,
      slug: getManagerSlug(mgrName),
      seasonsCount: mgrDrafts.length,
      avgRounds,
      earliestPosition: earliestPos || "N/A",
      latestPosition: latestPos || "N/A",
      positionCounts: posCounts,
      totalPicks,
    });
  }

  return styles.sort((a, b) => b.seasonsCount - a.seasonsCount);
}

function getDraftValuePicks(): {
  bestValues: DraftValuePick[];
  worstValues: DraftValuePick[];
} {
  const drafts = loadAllDrafts();

  const allValues: DraftValuePick[] = [];

  for (const draft of drafts) {
    const posRounds: Record<string, number[]> = {};
    for (const p of draft.picks) {
      const pos = normPos(p.position);
      if (!posRounds[pos]) posRounds[pos] = [];
      posRounds[pos].push(p.round);
    }

    const posAvg: Record<string, number> = {};
    for (const [pos, rounds] of Object.entries(posRounds)) {
      if (rounds.length > 0) {
        posAvg[pos] = rounds.reduce((s, r) => s + r, 0) / rounds.length;
      }
    }

    for (const p of draft.picks) {
      const pos = normPos(p.position);
      if (!SKILL_POSITIONS.includes(pos as SkillPosition)) continue;
      const avg = posAvg[pos];
      if (avg == null || !isFinite(avg)) continue;

      const delta = Math.round((avg - p.round) * 10) / 10;
      allValues.push({
        year: draft.year,
        managerName: normalizeManagerName(p.managerName),
        playerName: p.playerName,
        position: pos,
        round: p.round,
        pick: p.pick,
        positionAvgRound: Math.round(avg * 10) / 10,
        valueDelta: delta,
      });
    }
  }

  allValues.sort((a, b) => b.valueDelta - a.valueDelta);

  return {
    bestValues: allValues.slice(0, 15),
    worstValues: allValues.slice(-15).reverse(),
  };
}

export { getManagerDraftStyles, getDraftValuePicks };
