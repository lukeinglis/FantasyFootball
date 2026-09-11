import { loadAllDrafts, normalizeManagerName } from "@/lib/managers";
import historyData from "@/data/history.json";
import logger from "@/lib/logger";

// The position palette moved to its own module so client components can import
// it without pulling this file's filesystem reads into the browser bundle.
export { POS_COLORS, POS_TEXT, POS_FILL } from "@/lib/positions";

export interface SeasonRecord {
  year: number;
  champion?: string;
  championTeam?: string;
  runnerUp?: string;
  runnerUpTeam?: string;
  third?: string;
  thirdTeam?: string;
}

export function computeRecords() {
  logger.info("computing league records");
  const drafts = loadAllDrafts();
  const history = (historyData as { seasons: SeasonRecord[] }).seasons;
  const allPicks = drafts.flatMap((d) =>
    d.picks.map((p) => ({ ...p, _year: d.year }))
  );

  const champCounts: Record<string, number> = {};
  const runnerUpCounts: Record<string, number> = {};
  const thirdCounts: Record<string, number> = {};
  const top3Counts: Record<string, number> = {};
  for (const s of history) {
    const c = normalizeManagerName(s.champion || "");
    const r = normalizeManagerName(s.runnerUp || "");
    const t = normalizeManagerName(s.third || "");
    if (c) { champCounts[c] = (champCounts[c] || 0) + 1; top3Counts[c] = (top3Counts[c] || 0) + 1; }
    if (r) { runnerUpCounts[r] = (runnerUpCounts[r] || 0) + 1; top3Counts[r] = (top3Counts[r] || 0) + 1; }
    if (t) { thirdCounts[t] = (thirdCounts[t] || 0) + 1; top3Counts[t] = (top3Counts[t] || 0) + 1; }
  }

  const managerYears: Record<string, Set<number>> = {};
  for (const p of allPicks) {
    const n = normalizeManagerName(p.managerName);
    if (!managerYears[n]) managerYears[n] = new Set();
    managerYears[n].add(p._year);
  }

  const ironmen = Object.entries(managerYears)
    .map(([name, years]) => {
      const sorted = [...years].sort((a, b) => a - b);
      let maxStreak = 1, current = 1;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === sorted[i - 1] + 1) { current++; maxStreak = Math.max(maxStreak, current); }
        else current = 1;
      }
      return { name, total: years.size, consecutive: maxStreak, first: sorted[0], last: sorted[sorted.length - 1] };
    })
    .sort((a, b) => b.consecutive - a.consecutive);

  const playerDrafts: Record<string, { count: number; pos: string; nflTeam: string; years: number[] }> = {};
  for (const p of allPicks) {
    if (!p.playerName) continue;
    if (!playerDrafts[p.playerName]) playerDrafts[p.playerName] = { count: 0, pos: p.position, nflTeam: p.nflTeam, years: [] };
    playerDrafts[p.playerName].count++;
    if (!playerDrafts[p.playerName].years.includes(p._year)) playerDrafts[p.playerName].years.push(p._year);
  }
  const mostDrafted = Object.entries(playerDrafts)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.count - a.count);

  const loyaltyMap: Record<string, Record<string, { count: number; pos: string }>> = {};
  for (const p of allPicks) {
    if (!p.playerName) continue;
    const mgr = normalizeManagerName(p.managerName);
    if (!loyaltyMap[mgr]) loyaltyMap[mgr] = {};
    if (!loyaltyMap[mgr][p.playerName]) loyaltyMap[mgr][p.playerName] = { count: 0, pos: p.position };
    loyaltyMap[mgr][p.playerName].count++;
  }
  const loyaltyRecords = Object.entries(loyaltyMap)
    .flatMap(([mgr, players]) =>
      Object.entries(players).map(([player, data]) => ({ manager: mgr, player, ...data }))
    )
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const firstOveralls = drafts
    .map((d) => {
      const first = d.picks.find((p) => p.pick === 1);
      return first ? { year: d.year, player: first.playerName, pos: first.position, nflTeam: first.nflTeam, manager: normalizeManagerName(first.managerName) } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.year - a.year);

  const firstPickCounts: Record<string, number> = {};
  for (const fo of firstOveralls) {
    firstPickCounts[fo.manager] = (firstPickCounts[fo.manager] || 0) + 1;
  }

  const nflTeamCounts: Record<string, number> = {};
  for (const p of allPicks) {
    if (p.nflTeam) nflTeamCounts[p.nflTeam] = (nflTeamCounts[p.nflTeam] || 0) + 1;
  }
  const topNflTeams = Object.entries(nflTeamCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const mgrFirstQb: Record<string, number[]> = {};
  for (const d of drafts) {
    const seen: Record<string, boolean> = {};
    for (const p of [...d.picks].sort((a, b) => a.round - b.round)) {
      const mgr = normalizeManagerName(p.managerName);
      if (p.position === "QB" && !seen[mgr]) {
        seen[mgr] = true;
        if (!mgrFirstQb[mgr]) mgrFirstQb[mgr] = [];
        mgrFirstQb[mgr].push(p.round);
      }
    }
  }
  const qbTimers = Object.entries(mgrFirstQb)
    .map(([name, rounds]) => ({ name, avg: rounds.reduce((s, r) => s + r, 0) / rounds.length, drafts: rounds.length }))
    .sort((a, b) => a.avg - b.avg);

  const bridesmaids = Object.entries(runnerUpCounts)
    .filter(([name]) => !champCounts[name])
    .sort((a, b) => b[1] - a[1]);

  const r1ByYear = drafts.map((d) => {
    const r1 = d.picks.filter((p) => p.round === 1);
    const posCounts: Record<string, number> = {};
    for (const p of r1) posCounts[p.position] = (posCounts[p.position] || 0) + 1;
    return { year: d.year, positions: posCounts };
  }).sort((a, b) => a.year - b.year);

  const keeperPicks = allPicks.filter((p) => p.isKeeper);
  const totalKeepers = keeperPicks.length;
  const keepersByYear = drafts.map((d) => ({
    year: d.year,
    keepers: d.picks.filter((p) => p.isKeeper).length,
    total: d.picks.length,
  })).sort((a, b) => a.year - b.year);

  const keeperStreaks: { player: string; manager: string; pos: string; years: number[]; streak: number }[] = [];
  const mgrPlayerYears: Record<string, Record<string, number[]>> = {};
  for (const d of drafts) {
    for (const p of d.picks) {
      if (!p.playerName) continue;
      const mgr = normalizeManagerName(p.managerName);
      if (!mgrPlayerYears[mgr]) mgrPlayerYears[mgr] = {};
      if (!mgrPlayerYears[mgr][p.playerName]) mgrPlayerYears[mgr][p.playerName] = [];
      mgrPlayerYears[mgr][p.playerName].push(d.year);
    }
  }
  for (const [mgr, players] of Object.entries(mgrPlayerYears)) {
    for (const [player, years] of Object.entries(players)) {
      if (years.length < 3) continue;
      const sorted = [...years].sort((a, b) => a - b);
      let maxStreak = 1, current = 1, start = 0, bestStart = 0;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === sorted[i - 1] + 1) {
          current++;
          if (current > maxStreak) { maxStreak = current; bestStart = start; }
        } else { current = 1; start = i; }
      }
      const streakYears = sorted.slice(bestStart, bestStart + maxStreak);
      const firstPick = allPicks.find((p) => normalizeManagerName(p.managerName) === mgr && p.playerName === player);
      keeperStreaks.push({
        player, manager: mgr, pos: firstPick?.position || "",
        years: streakYears, streak: maxStreak,
      });
    }
  }
  keeperStreaks.sort((a, b) => b.streak - a.streak);

  const keepersByMgr: Record<string, number> = {};
  for (const p of keeperPicks) {
    const mgr = normalizeManagerName(p.managerName);
    keepersByMgr[mgr] = (keepersByMgr[mgr] || 0) + 1;
  }
  const topKeepers = Object.entries(keepersByMgr).sort((a, b) => b[1] - a[1]);

  return {
    totalPicks: allPicks.length,
    totalDrafts: drafts.length,
    totalSeasons: history.length,
    uniqueChamps: Object.keys(champCounts).length,
    champCounts,
    runnerUpCounts,
    top3Counts,
    ironmen,
    mostDrafted,
    loyaltyRecords,
    firstOveralls,
    firstPickCounts,
    topNflTeams,
    qbTimers,
    bridesmaids,
    r1ByYear,
    totalKeepers,
    keepersByYear,
    keeperStreaks,
    topKeepers,
  };
}

export function denseRanks<T>(items: T[], valueFn: (item: T) => number | string): number[] {
  const ranks: number[] = [];
  let currentRank = 1;
  for (let i = 0; i < items.length; i++) {
    if (i > 0 && valueFn(items[i]) !== valueFn(items[i - 1])) {
      currentRank = ranks[i - 1] + 1;
    }
    ranks.push(currentRank);
  }
  return ranks;
}
