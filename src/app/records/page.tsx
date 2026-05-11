import type { Metadata } from "next";
import Link from "next/link";
import { loadAllDrafts, normalizeManagerName, getManagerSlug } from "@/lib/managers";
import historyData from "@/data/history.json";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardHeader, CardBody } from "@/components/Card";

export const metadata: Metadata = {
  title: "Record Book",
  description:
    "All-time records, draft superlatives, and legendary stats from Greybushes & Chili Dogs.",
};

interface SeasonRecord {
  year: number;
  champion?: string;
  championTeam?: string;
  runnerUp?: string;
  runnerUpTeam?: string;
  third?: string;
  thirdTeam?: string;
}

const POS_COLORS: Record<string, string> = {
  QB: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  RB: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  WR: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  TE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  K: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  DEF: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

function computeRecords() {
  const drafts = loadAllDrafts();
  const history = (historyData as { seasons: SeasonRecord[] }).seasons;
  const allPicks = drafts.flatMap((d) =>
    d.picks.map((p) => ({ ...p, _year: d.year }))
  );

  // Championship records
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

  // Seasons played per manager
  const managerYears: Record<string, Set<number>> = {};
  for (const p of allPicks) {
    const n = normalizeManagerName(p.managerName);
    if (!managerYears[n]) managerYears[n] = new Set();
    managerYears[n].add(p._year);
  }

  // Ironmen (most consecutive seasons)
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

  // Most drafted players
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

  // Loyalty records (same manager drafts same player most)
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

  // #1 overall picks
  const firstOveralls = drafts
    .map((d) => {
      const first = d.picks.find((p) => p.pick === 1);
      return first ? { year: d.year, player: first.playerName, pos: first.position, nflTeam: first.nflTeam, manager: normalizeManagerName(first.managerName) } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.year - a.year);

  // Most #1 picks
  const firstPickCounts: Record<string, number> = {};
  for (const fo of firstOveralls) {
    firstPickCounts[fo.manager] = (firstPickCounts[fo.manager] || 0) + 1;
  }

  // Most drafted NFL teams
  const nflTeamCounts: Record<string, number> = {};
  for (const p of allPicks) {
    if (p.nflTeam) nflTeamCounts[p.nflTeam] = (nflTeamCounts[p.nflTeam] || 0) + 1;
  }
  const topNflTeams = Object.entries(nflTeamCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Earliest/latest QB drafters
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

  // Bridesmaid award (most runner-ups without a title)
  const bridesmaids = Object.entries(runnerUpCounts)
    .filter(([name]) => !champCounts[name])
    .sort((a, b) => b[1] - a[1]);

  // R1 position trends
  const r1ByYear = drafts.map((d) => {
    const r1 = d.picks.filter((p) => p.round === 1);
    const posCounts: Record<string, number> = {};
    for (const p of r1) posCounts[p.position] = (posCounts[p.position] || 0) + 1;
    return { year: d.year, positions: posCounts };
  }).sort((a, b) => a.year - b.year);

  // Keeper analytics
  const keeperPicks = allPicks.filter((p) => p.isKeeper);
  const totalKeepers = keeperPicks.length;
  const keepersByYear = drafts.map((d) => ({
    year: d.year,
    keepers: d.picks.filter((p) => p.isKeeper).length,
    total: d.picks.length,
  })).sort((a, b) => a.year - b.year);

  // Longest kept players (same manager, same player across most consecutive years)
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

  // Most keepers per manager
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

export default function RecordsPage() {
  const r = computeRecords();

  const top3List = Object.entries(r.top3Counts).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader
        eyebrow="Hall of Records"
        title="Record Book"
        subtitle={`${r.totalPicks.toLocaleString()} picks. ${r.totalSeasons} seasons. ${r.uniqueChamps} unique champions. The numbers that define the league.`}
      />

      {/* Stats Banner */}
      <Container>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <StatCard label="Total Picks" value={r.totalPicks.toLocaleString()} />
          <StatCard label="Seasons" value={String(r.totalSeasons)} />
          <StatCard label="Unique Champs" value={String(r.uniqueChamps)} highlight />
          <StatCard label="Repeat Winners" value="0" />
        </div>
      </Container>

      {/* Dynasty Rankings */}
      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="Dynasty Rankings" description="Most top-3 finishes all time" />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {top3List.slice(0, 10).map(([name, count], i) => {
                  const titles = r.champCounts[name] || 0;
                  return (
                    <Link key={name} href={`/managers/${getManagerSlug(name)}`} className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-sm font-bold ${i < 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-gray-300"}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white">{name}</p>
                        <p className="text-xs text-gray-400">{titles} title{titles !== 1 ? "s" : ""}, {count} podium{count !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: count }).map((_, j) => (
                          <div key={j} className={`h-2.5 w-2.5 rounded-full ${j < titles ? "bg-[#DD550C]" : "bg-[#DD550C]/30"}`} />
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Ironmen" description="Most consecutive seasons in the league" />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {r.ironmen.slice(0, 10).map((im, i) => (
                  <Link key={im.name} href={`/managers/${getManagerSlug(im.name)}`} className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors">
                    <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-sm font-bold ${i < 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-gray-300"}`}>{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{im.name}</p>
                      <p className="text-xs text-gray-400">{im.first} to {im.last}</p>
                    </div>
                    <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-white">{im.consecutive}</span>
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* Bridesmaid Award */}
      {r.bridesmaids.length > 0 && (
        <Container className="pt-0">
          <Card className="overflow-hidden border-amber-500/20">
            <CardHeader title="Bridesmaid Award" description="Most runner-up finishes without ever winning the title" />
            <CardBody>
              <div className="flex flex-wrap gap-4">
                {r.bridesmaids.map(([name, count]) => (
                  <Link key={name} href={`/managers/${getManagerSlug(name)}`} className="flex items-center gap-3 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3 hover:bg-amber-500/10 transition-colors">
                    <span className="text-2xl">🥈</span>
                    <div>
                      <p className="font-[family-name:var(--font-heading)] font-bold text-white uppercase">{name}</p>
                      <p className="text-xs text-amber-300">{count} runner-up finish{count > 1 ? "es" : ""}, 0 titles</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>
        </Container>
      )}

      {/* Draft Records */}
      <Container className="pt-0">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-wide text-white mb-6">Draft Records</h2>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Loyalty Records */}
          <Card className="overflow-hidden">
            <CardHeader title="Most Loyal Drafters" description="Same manager drafting the same player across seasons" />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {r.loyaltyRecords.map((lr, i) => (
                  <div key={`${lr.manager}-${lr.player}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${i < 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-gray-300"}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-white">
                        <span className="font-semibold">{lr.manager}</span>
                        <span className="text-gray-400"> drafted </span>
                        <span className="font-semibold">{lr.player}</span>
                      </p>
                      <span className={`rounded-full border px-1.5 py-0 text-[9px] font-bold ${POS_COLORS[lr.pos] || "bg-white/10 text-gray-200 border-white/20"}`}>{lr.pos}</span>
                    </div>
                    <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#DD550C]">{lr.count}x</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Most Drafted Players */}
          <Card className="overflow-hidden">
            <CardHeader title="Most Drafted Players" description="Players taken most times across all league drafts" />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {r.mostDrafted.slice(0, 12).map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${i < 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-gray-300"}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold text-white">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.nflTeam}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${POS_COLORS[p.pos] || "bg-white/10 text-gray-200 border-white/20"}`}>{p.pos}</span>
                    <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-white">{p.count}x</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* First Overall Picks + QB Timer */}
      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="#1 Overall Picks" description="Every first pick in league history" />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {r.firstOveralls.map((fo) => (
                  <div key={fo.year} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 transition-colors">
                    <span className="font-[family-name:var(--font-heading)] font-mono text-lg font-bold text-[#DD550C] w-12">{fo.year}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{fo.player}</p>
                      <p className="text-xs text-gray-400">{fo.pos} · {fo.nflTeam}</p>
                    </div>
                    <Link href={`/managers/${getManagerSlug(fo.manager)}`} className="text-sm text-gray-400 hover:text-[#DD550C]">{fo.manager}</Link>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="QB Timer" description="Average round of first QB pick (earliest to latest)" />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {r.qbTimers.map((qt, i) => {
                  const maxAvg = r.qbTimers[r.qbTimers.length - 1]?.avg || 16;
                  const pct = Math.min(100, (qt.avg / maxAvg) * 100);
                  return (
                    <Link key={qt.name} href={`/managers/${getManagerSlug(qt.name)}`} className="block px-5 py-2.5 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-white text-sm">{qt.name}</span>
                        <span className="font-mono text-sm text-gray-300">R{qt.avg.toFixed(1)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full rounded-full ${qt.avg <= 4 ? "bg-rose-500" : qt.avg <= 7 ? "bg-sky-500" : "bg-gray-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* NFL Teams + R1 Trends */}
      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="Most Drafted NFL Teams" description="Total picks from each NFL franchise across all drafts" />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {r.topNflTeams.map(([team, count], i) => {
                  const maxCount = r.topNflTeams[0]?.[1] || 1;
                  const pct = (count / maxCount) * 100;
                  return (
                    <div key={team} className="px-5 py-2.5 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-[10px] font-bold ${i < 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-gray-300"}`}>{i + 1}</span>
                          <span className="font-semibold text-white">{team}</span>
                        </div>
                        <span className="font-mono text-sm text-gray-400">{count} picks</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#DD550C] to-[#ff8a3d]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Round 1 Evolution" description="How first-round position preferences have shifted" />
            <CardBody className="!p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#0C2340] text-[10px] uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="px-3 py-2 text-left">Year</th>
                      <th className="px-3 py-2 text-center">RB</th>
                      <th className="px-3 py-2 text-center">WR</th>
                      <th className="px-3 py-2 text-center">QB</th>
                      <th className="px-3 py-2 text-center">TE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {r.r1ByYear.map((yr) => (
                      <tr key={yr.year} className="hover:bg-white/5 transition-colors">
                        <td className="px-3 py-2 font-[family-name:var(--font-heading)] font-bold text-[#DD550C]">{yr.year}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-300 font-bold">{yr.positions["RB"] || 0}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-block rounded bg-sky-500/20 px-2 py-0.5 text-sky-300 font-bold">{yr.positions["WR"] || 0}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block rounded px-2 py-0.5 font-bold ${yr.positions["QB"] ? "bg-rose-500/20 text-rose-300" : "text-gray-600"}`}>{yr.positions["QB"] || 0}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block rounded px-2 py-0.5 font-bold ${yr.positions["TE"] ? "bg-amber-500/20 text-amber-300" : "text-gray-600"}`}>{yr.positions["TE"] || 0}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* Keeper Records */}
      <Container className="pt-0">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-wide text-white mb-6">Keeper Records</h2>
        <p className="mb-6 text-sm text-gray-400">
          342 inferred keepers across 10 seasons. Early years (2016-2020): keepers slotted into final rounds.
          Recent years (2023+): keepers held at their original draft round.
        </p>

        {/* Keeper stats banner */}
        <div className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
          <StatCard label="Total Keepers" value={r.totalKeepers.toString()} />
          <StatCard label="Avg / Draft" value={r.keepersByYear.length > 1 ? Math.round(r.totalKeepers / (r.keepersByYear.length - 1)).toString() : "0"} />
          <StatCard label="Longest Streak" value={r.keeperStreaks[0]?.streak.toString() || "0"} highlight />
          <StatCard label="Seasons Tracked" value={(r.keepersByYear.length - 1).toString()} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Longest Keeper Streaks */}
          <Card className="overflow-hidden">
            <CardHeader title="Longest Keeper Streaks" description="Same manager, same player, most consecutive seasons" />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {r.keeperStreaks.slice(0, 12).map((ks, i) => (
                  <div key={`${ks.manager}-${ks.player}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${i < 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-gray-300"}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-white">
                        <Link href={`/managers/${getManagerSlug(ks.manager)}`} className="font-semibold hover:text-[#DD550C]">{ks.manager}</Link>
                        <span className="text-gray-400"> kept </span>
                        <span className="font-semibold">{ks.player}</span>
                      </p>
                      <p className="text-xs text-gray-400">{ks.years[0]} to {ks.years[ks.years.length - 1]}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#DD550C]">{ks.streak}</span>
                      <span className="text-xs text-gray-500 ml-1">yrs</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Most Keepers by Manager */}
          <Card className="overflow-hidden">
            <CardHeader title="Keeper Volume" description="Total keeper picks per manager (all time)" />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {r.topKeepers.slice(0, 12).map(([name, count], i) => {
                  const maxCount = r.topKeepers[0]?.[1] || 1;
                  const pct = (count / maxCount) * 100;
                  return (
                    <Link key={name} href={`/managers/${getManagerSlug(name)}`} className="block px-5 py-2.5 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-[10px] font-bold ${i < 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-gray-300"}`}>{i + 1}</span>
                          <span className="font-semibold text-white">{name}</span>
                        </div>
                        <span className="font-mono text-sm text-gray-400">{count} keepers</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#DD550C] to-[#ff8a3d]" style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Keepers by Year */}
        <div className="mt-6">
          <Card className="overflow-hidden">
            <CardHeader title="Keepers by Season" description="How many players were kept each year" />
            <CardBody>
              <div className="flex items-end gap-2 h-32">
                {r.keepersByYear.map((ky) => {
                  const pct = ky.total > 0 ? (ky.keepers / ky.total) * 100 : 0;
                  const heightPct = Math.max(4, (ky.keepers / 50) * 100);
                  return (
                    <div key={ky.year} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-mono text-gray-400">{ky.keepers}</span>
                      <div className="w-full rounded-t bg-gradient-to-t from-[#DD550C] to-[#ff8a3d]" style={{ height: `${heightPct}%` }} />
                      <span className="text-[9px] text-gray-500">{String(ky.year).slice(2)}</span>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>
    </>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card variant="glass">
      <CardBody>
        <div className="text-center">
          <p className="font-[family-name:var(--font-heading)] text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">{label}</p>
          <p className={`mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold ${highlight ? "text-gradient" : "text-white"}`}>{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}
