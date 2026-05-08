import type { Metadata } from "next";
import Link from "next/link";
import { computeLeagueAnalytics, getManagerSlug } from "@/lib/managers";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardBody, CardHeader } from "@/components/Card";

export const metadata: Metadata = {
  title: "Draft Insights",
  description: "League-wide draft analytics, tendencies, and historical patterns for Greybushes & Chili Dogs.",
};

const POS_COLORS: Record<string, string> = {
  QB: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  RB: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  WR: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  TE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  K: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  DEF: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const POS_BG_SOLID: Record<string, string> = {
  QB: "bg-rose-500",
  RB: "bg-emerald-500",
  WR: "bg-sky-500",
  TE: "bg-amber-500",
  K: "bg-violet-500",
  DEF: "bg-slate-500",
};

const POS_TEXT: Record<string, string> = {
  QB: "text-rose-400",
  RB: "text-emerald-400",
  WR: "text-sky-400",
  TE: "text-amber-400",
  K: "text-violet-400",
  DEF: "text-slate-400",
};

const CORE_POS_ORDER = ["QB", "RB", "WR", "TE", "K", "DEF"];
const SKILL_POSITIONS = ["QB", "RB", "WR", "TE"];

export default function DraftInsightsPage() {
  const analytics = computeLeagueAnalytics();

  // Archetype distribution
  const archetypeCounts: Record<string, number> = {};
  for (const a of analytics.archetypes) {
    archetypeCounts[a.archetype] = (archetypeCounts[a.archetype] || 0) + 1;
  }
  const archetypeEntries = Object.entries(archetypeCounts).sort((a, b) => b[1] - a[1]);

  // Champion round-1 position distribution
  const champR1Counts: Record<string, number> = {};
  for (const cp of analytics.championProfiles) {
    if (cp.round1Position !== "N/A") {
      champR1Counts[cp.round1Position] = (champR1Counts[cp.round1Position] || 0) + 1;
    }
  }

  // Top 15 NFL teams
  const topTeams = analytics.nflTeamPopularity.slice(0, 15);
  const maxTeamPicks = topTeams.length > 0 ? topTeams[0].totalPicks : 1;

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Draft Insights"
        subtitle={`${analytics.totalPicks.toLocaleString()} picks across ${analytics.totalDrafts} drafts from ${analytics.totalManagers} managers`}
      />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* QUICK STATS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Container>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickStat label="Total Picks" value={analytics.totalPicks.toLocaleString()} />
          <QuickStat label="Drafts" value={String(analytics.totalDrafts)} />
          <QuickStat label="Managers" value={String(analytics.totalManagers)} />
          <QuickStat label="NFL Teams" value={String(analytics.nflTeamPopularity.length)} />
        </div>
      </Container>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* POSITION VALUE OVER TIME */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Container className="pt-0">
        <Card className="overflow-hidden">
          <CardHeader
            title="Round 1 Position Breakdown by Year"
            description="How the league's first-round strategy has evolved (% of R1 picks by position)"
          />
          <CardBody className="!p-0 overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="sticky left-0 bg-[#112d4e] px-3 py-2 text-left font-[family-name:var(--font-heading)] text-[10px] uppercase tracking-[0.15em] text-gray-400">
                    Year
                  </th>
                  {SKILL_POSITIONS.map((pos) => (
                    <th key={pos} className="px-3 py-2">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[pos]}`}>
                        {pos}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analytics.positionByYear.map((pby) => (
                  <tr key={pby.year} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="sticky left-0 bg-[#112d4e] px-3 py-2 text-left font-[family-name:var(--font-heading)] font-mono text-sm font-bold text-[#DD550C]">
                      {pby.year}
                    </td>
                    {SKILL_POSITIONS.map((pos) => {
                      const pct = pby.round1Pcts[pos] || 0;
                      return (
                        <td key={pos} className="px-3 py-2">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-12 h-3 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${POS_BG_SOLID[pos]}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`font-mono text-[10px] ${pct > 0 ? "text-gray-300" : "text-gray-600"}`}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </Container>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* DRAFT ARCHETYPE DISTRIBUTION */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Archetype pie-ish view */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Draft Archetypes"
              description="How league managers are classified by draft approach"
            />
            <CardBody>
              <div className="space-y-3 mb-6">
                {archetypeEntries.map(([archetype, count]) => {
                  const pct = Math.round((count / analytics.archetypes.length) * 100);
                  return (
                    <div key={archetype}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-white">{archetype}</span>
                        <span className="font-mono text-xs text-gray-400">{count} managers ({pct}%)</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#DD550C] to-[#ff8a3d]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Manager list by archetype */}
              <div className="space-y-2">
                {analytics.archetypes.map((a) => (
                  <Link
                    key={a.name}
                    href={`/managers/${a.slug}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5 transition-colors"
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#DD550C]/10 border border-[#DD550C]/30 font-[family-name:var(--font-heading)] text-xs font-bold text-[#DD550C]">
                      {a.name.charAt(0)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{a.name}</p>
                      <p className="text-[10px] text-gray-400">{a.archetype}</p>
                    </div>
                    {a.draftDNA.length > 0 && (
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[a.draftDNA[0].position]}`}>
                        {a.draftDNA[0].position} R{a.draftDNA[0].avgFirstRound}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Champion Draft Profile */}
          <Card className="overflow-hidden">
            <CardHeader
              title="What Champions Draft"
              description="Round 1 position choices of title winners"
            />
            <CardBody>
              {/* Aggregate champion R1 distribution */}
              <div className="mb-6 rounded-xl bg-[#0C2340] border border-white/10 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">Champion Round 1 Picks</p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(champR1Counts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([pos, count]) => (
                      <div key={pos} className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[pos]}`}>{pos}</span>
                        <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-white">{count}</span>
                        <span className="text-[10px] text-gray-400">titles</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Champion per year */}
              <div className="divide-y divide-white/5">
                {analytics.championProfiles.map((cp) => (
                  <div key={cp.year} className="flex items-center gap-3 py-2.5 hover:bg-white/5 transition-colors px-1 rounded">
                    <span className="font-[family-name:var(--font-heading)] font-mono text-sm font-bold text-[#DD550C] w-10">{cp.year}</span>
                    <span className="text-xl">🏆</span>
                    <Link
                      href={`/managers/${getManagerSlug(cp.champion)}`}
                      className="text-sm font-semibold text-white hover:text-[#DD550C] transition-colors flex-1"
                    >
                      {cp.champion}
                    </Link>
                    {cp.round1Position !== "N/A" && (
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[cp.round1Position]}`}>
                        R1: {cp.round1Position}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MOST POPULAR NFL TEAMS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Container className="pt-0">
        <Card className="overflow-hidden">
          <CardHeader
            title="Most Drafted NFL Teams"
            description="Which NFL teams' players are drafted most across all 11 seasons"
          />
          <CardBody>
            <div className="space-y-2">
              {topTeams.map((team, i) => {
                const pct = Math.round((team.totalPicks / maxTeamPicks) * 100);
                return (
                  <div key={team.team} className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${
                      i < 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-gray-300"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="w-12 text-sm font-bold text-white">{team.team}</span>
                    <div className="flex-1">
                      <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#DD550C] to-[#ff8a3d] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-mono text-xs text-gray-400 w-16 text-right">{team.totalPicks} picks</span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </Container>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* POSITION SCARCITY TIMELINE */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Container className="pt-0">
        <Card className="overflow-hidden">
          <CardHeader
            title="Position Scarcity"
            description="When each position gets drafted: avg first pick, last pick, and round-by-round volume"
          />
          <CardBody>
            <div className="space-y-6">
              {analytics.positionScarcity
                .filter((ps) => SKILL_POSITIONS.includes(ps.position))
                .sort((a, b) => a.avgFirstRound - b.avgFirstRound)
                .map((ps) => {
                  const maxCount = Math.max(1, ...ps.pickDistribution.map((d) => d.count));
                  return (
                    <div key={ps.position}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${POS_COLORS[ps.position]}`}>
                          {ps.position}
                        </span>
                        <span className="text-xs text-gray-400">
                          First pick avg: <span className="text-white font-bold">R{ps.avgFirstRound}</span>
                        </span>
                        <span className="text-xs text-gray-400">
                          Last pick avg: <span className="text-white font-bold">R{ps.avgLastRound}</span>
                        </span>
                      </div>

                      {/* Round distribution bars */}
                      <div className="flex items-end gap-0.5 h-12">
                        {Array.from({ length: 16 }, (_, i) => i + 1).map((round) => {
                          const dist = ps.pickDistribution.find((d) => d.round === round);
                          const count = dist?.count || 0;
                          const height = count > 0 ? Math.max(4, (count / maxCount) * 48) : 0;
                          return (
                            <div key={round} className="flex-1 flex flex-col items-center justify-end" title={`R${round}: ${count} picks`}>
                              {count > 0 && (
                                <div
                                  className={`w-full rounded-t ${POS_BG_SOLID[ps.position]} opacity-70 hover:opacity-100 transition-opacity`}
                                  style={{ height: `${height}px` }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from({ length: 16 }, (_, i) => i + 1).map((round) => (
                          <span key={round} className="flex-1 text-center text-[8px] text-gray-600">
                            {round}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}

              {/* K and DEF scarcity (compact) */}
              <div className="grid grid-cols-2 gap-4">
                {analytics.positionScarcity
                  .filter((ps) => ps.position === "K" || ps.position === "DEF")
                  .map((ps) => (
                    <div key={ps.position} className="rounded-xl bg-white/5 border border-white/10 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[ps.position]}`}>
                          {ps.position}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-gray-400">Avg first:</span>
                          <span className="ml-1 text-white font-bold">R{ps.avgFirstRound}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Avg last:</span>
                          <span className="ml-1 text-white font-bold">R{ps.avgLastRound}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </Container>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* LEAGUE-WIDE DRAFT DNA COMPARISON */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Container className="pt-0">
        <Card className="overflow-hidden">
          <CardHeader
            title="Draft DNA Comparison"
            description="Every manager's average first-pick round per position, side by side"
          />
          <CardBody className="!p-0 overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="sticky left-0 bg-[#112d4e] px-3 py-2 text-left font-[family-name:var(--font-heading)] text-[10px] uppercase tracking-[0.15em] text-gray-400 min-w-[100px]">
                    Manager
                  </th>
                  {CORE_POS_ORDER.map((pos) => (
                    <th key={pos} className="px-2 py-2">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[pos]}`}>
                        {pos}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analytics.archetypes
                  .sort((a, b) => {
                    const aFirst = a.draftDNA[0]?.avgFirstRound || 99;
                    const bFirst = b.draftDNA[0]?.avgFirstRound || 99;
                    return aFirst - bFirst;
                  })
                  .map((mgr) => (
                    <tr key={mgr.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="sticky left-0 bg-[#112d4e] px-3 py-1.5 text-left">
                        <Link
                          href={`/managers/${mgr.slug}`}
                          className="text-sm font-semibold text-white hover:text-[#DD550C] transition-colors"
                        >
                          {mgr.name}
                        </Link>
                      </td>
                      {CORE_POS_ORDER.map((pos) => {
                        const dna = mgr.draftDNA.find((d) => d.position === pos);
                        if (!dna) return <td key={pos} className="px-2 py-1.5 text-gray-700">&middot;</td>;
                        const roundClass =
                          dna.avgFirstRound <= 3 ? "bg-[#DD550C]/20 text-[#DD550C] font-bold" :
                          dna.avgFirstRound <= 8 ? "bg-sky-600/20 text-sky-300" :
                          "text-gray-500";
                        return (
                          <td key={pos} className="px-2 py-1.5">
                            <span className={`inline-block rounded-md px-2 py-0.5 font-mono text-[11px] ${roundClass}`}>
                              {dna.avgFirstRound}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </Container>
    </>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#112d4e] p-4 text-center">
      <p className="font-[family-name:var(--font-heading)] text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
