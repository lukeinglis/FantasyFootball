import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildManagerProfile, slugToName, getAllManagerNames, getManagerSlug } from "@/lib/managers";
import type { DraftDNA, DraftCapital, EraBreakdown, HeatmapCell } from "@/lib/managers";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardBody, CardHeader } from "@/components/Card";

export function generateStaticParams() {
  const names = getAllManagerNames();
  return names.map((name) => ({ slug: getManagerSlug(name) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = slugToName(slug);
  return {
    title: `${name} Profile`,
    description: `Draft history and league stats for ${name} in Greybushes & Chili Dogs.`,
  };
}

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

/** Color for Draft DNA round badges */
function dnaRoundClass(avg: number): string {
  if (avg <= 3) return "bg-[#DD550C] text-white";
  if (avg <= 8) return "bg-sky-600 text-white";
  return "bg-gray-600 text-gray-200";
}

/** Label for Draft DNA round badges */
function dnaRoundLabel(avg: number): string {
  if (avg <= 3) return "Early";
  if (avg <= 8) return "Mid";
  return "Late";
}

const CORE_POS_ORDER = ["QB", "RB", "WR", "TE", "K", "DEF"];

export default async function ManagerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const name = slugToName(slug);
  const profile = buildManagerProfile(name);

  if (!profile) notFound();

  const topPositions = Object.entries(profile.positionBreakdown)
    .sort((a, b) => b[1] - a[1]);
  const totalPosPicks = topPositions.reduce((s, [, c]) => s + c, 0);

  const topNflTeams = Object.entries(profile.nflTeamBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const podiumTotal = profile.championships + profile.runnerUpYears.length + profile.thirdPlaceYears.length;
  const keeperCount = profile.draftsByYear.reduce(
    (sum, d) => sum + d.picks.filter((p) => p.isKeeper).length, 0
  );

  // Compute max for heatmap intensity
  const heatmapMax = Math.max(1, ...profile.heatmap.map((c) => c.count));
  const maxRound = Math.max(1, ...profile.heatmap.map((c) => c.round));

  return (
    <>
      <PageHeader
        eyebrow={profile.isActive ? "Active Manager" : profile.isEmeritus ? "Emeritus" : "Historical"}
        title={profile.name}
        subtitle={profile.currentTeamName || undefined}
      >
        <Link
          href="/managers"
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/5"
        >
          All Managers
        </Link>
      </PageHeader>

      <Container>
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <StatCard label="Seasons" value={String(profile.yearsActive.length)} />
          <StatCard label="Titles" value={String(profile.championships)} highlight={profile.championships > 0} />
          <StatCard label="Podiums" value={String(podiumTotal)} />
          <StatCard label="Total Picks" value={profile.totalPicks.toLocaleString()} />
          <StatCard label="Keepers" value={String(keeperCount)} keeper />
          <StatCard label="First Active" value={String(Math.min(...profile.yearsActive))} />
          <StatCard label="Last Active" value={String(Math.max(...profile.yearsActive))} />
        </div>
      </Container>

      {/* Trophy Case */}
      {(profile.championshipYears.length > 0 || profile.runnerUpYears.length > 0 || profile.thirdPlaceYears.length > 0) && (
        <Container className="pt-0">
          <Card className="overflow-hidden">
            <CardHeader title="Trophy Case" />
            <CardBody>
              <div className="flex flex-wrap gap-3">
                {profile.championshipYears.map((y) => (
                  <TrophyBadge key={`champ-${y}`} year={y} label="Champion" icon="🏆" highlight />
                ))}
                {profile.runnerUpYears.map((y) => (
                  <TrophyBadge key={`ru-${y}`} year={y} label="Runner-Up" icon="🥈" />
                ))}
                {profile.thirdPlaceYears.map((y) => (
                  <TrophyBadge key={`3rd-${y}`} year={y} label="Third" icon="🥉" />
                ))}
              </div>
            </CardBody>
          </Card>
        </Container>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCOUTING REPORT */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Container className="pt-0">
        <Card className="overflow-hidden border-[#DD550C]/20">
          <CardHeader
            title="Scouting Report"
            description={`How to prepare when drafting against ${profile.name}`}
          />
          <CardBody>
            {/* Archetype badge */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[#DD550C]/10 border border-[#DD550C]/30">
                <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[#DD550C]">
                  {profile.scoutingReport.archetype.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-[family-name:var(--font-heading)] text-xl font-bold text-[#DD550C] uppercase tracking-wide">
                  {profile.scoutingReport.archetype}
                </p>
                <p className="text-sm text-gray-300">{profile.scoutingReport.archetypeDescription}</p>
              </div>
            </div>

            {/* Strengths / Weaknesses grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.scoutingReport.strengths.length > 0 && (
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
                  <p className="font-[family-name:var(--font-heading)] text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3">Strengths</p>
                  <ul className="space-y-1.5 text-sm text-gray-300">
                    {profile.scoutingReport.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {profile.scoutingReport.weaknesses.length > 0 && (
                <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4">
                  <p className="font-[family-name:var(--font-heading)] text-xs font-bold uppercase tracking-[0.2em] text-red-400 mb-3">Exploitable Weaknesses</p>
                  <ul className="space-y-1.5 text-sm text-gray-300">
                    {profile.scoutingReport.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Championship probability */}
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3">
              <span className="font-[family-name:var(--font-heading)] text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Championship Rate</span>
              <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white">{profile.scoutingReport.championshipProbability}%</span>
              <span className="text-xs text-gray-500">({profile.championships} titles in {profile.yearsActive.length} seasons)</span>
            </div>
          </CardBody>
        </Card>
      </Container>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* DRAFT DNA */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {profile.draftDNA.length > 0 && (
        <Container className="pt-0">
          <Card className="overflow-hidden">
            <CardHeader
              title="Draft DNA"
              description="Average round of first pick at each position across all drafts"
            />
            <CardBody>
              {/* Style narrative */}
              <div className="mb-6 rounded-xl bg-[#0C2340] border border-white/10 p-4">
                <p className="text-sm leading-relaxed text-gray-300 italic">
                  &ldquo;{profile.styleNarrative}&rdquo;
                </p>
              </div>

              {/* DNA bars */}
              <div className="space-y-3">
                {profile.draftDNA.map((dna) => (
                  <DraftDNABar key={dna.position} dna={dna} totalDrafts={profile.yearsActive.length} />
                ))}
              </div>
            </CardBody>
          </Card>
        </Container>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* POSITIONAL HEATMAP */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {profile.heatmap.length > 0 && (
        <Container className="pt-0">
          <Card className="overflow-hidden">
            <CardHeader
              title="Positional Pick Distribution"
              description={`What positions ${profile.name} picks in each round (${profile.yearsActive.length} drafts)`}
            />
            <CardBody className="!p-0 overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="sticky left-0 bg-[#112d4e] px-3 py-2 text-left font-[family-name:var(--font-heading)] text-[10px] uppercase tracking-[0.15em] text-gray-400">
                      Round
                    </th>
                    {CORE_POS_ORDER.map((pos) => (
                      <th key={pos} className="px-2 py-2">
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[pos] || "bg-white/10 text-gray-200 border-white/20"}`}>
                          {pos}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxRound }, (_, i) => i + 1).map((round) => (
                    <tr key={round} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="sticky left-0 bg-[#112d4e] px-3 py-1.5 text-left font-mono text-gray-400">
                        R{round}
                      </td>
                      {CORE_POS_ORDER.map((pos) => {
                        const cell = profile.heatmap.find(
                          (c) => c.round === round && c.position === pos
                        );
                        const count = cell?.count || 0;
                        const intensity = count / heatmapMax;
                        return (
                          <td key={pos} className="px-2 py-1.5">
                            {count > 0 ? (
                              <span
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md font-mono font-bold"
                                style={{
                                  backgroundColor: getHeatColor(pos, intensity),
                                  color: intensity > 0.5 ? "#fff" : "rgba(255,255,255,0.7)",
                                }}
                              >
                                {count}
                              </span>
                            ) : (
                              <span className="text-gray-700">&middot;</span>
                            )}
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
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* DRAFT CAPITAL ANALYSIS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {profile.draftCapital.length > 0 && (
        <Container className="pt-0">
          <Card className="overflow-hidden">
            <CardHeader
              title="Draft Capital Analysis"
              description="Where premium (R1-5), mid (R6-10), and late (R11-16) picks are spent"
            />
            <CardBody>
              <div className="space-y-4">
                {profile.draftCapital.map((cap) => (
                  <DraftCapitalBar key={cap.position} capital={cap} />
                ))}
              </div>
            </CardBody>
          </Card>
        </Container>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* YEAR-OVER-YEAR TRENDS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {profile.eraBreakdowns.length >= 2 && (
        <Container className="pt-0">
          <Card className="overflow-hidden">
            <CardHeader
              title="Year-over-Year Trends"
              description="How drafting strategy has evolved over time"
            />
            <CardBody>
              <div className="grid gap-6 sm:grid-cols-2">
                {profile.eraBreakdowns.map((era) => (
                  <div key={era.era} className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="font-[family-name:var(--font-heading)] text-sm font-bold text-[#DD550C] uppercase tracking-wide mb-3">
                      {era.era}
                    </p>

                    {/* Position mix */}
                    <div className="mb-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Position Mix</p>
                      <div className="flex h-5 w-full overflow-hidden rounded-full">
                        {CORE_POS_ORDER.filter((pos) => (era.positionPcts[pos] || 0) > 0).map((pos) => (
                          <div
                            key={pos}
                            className={`${POS_BG_SOLID[pos] || "bg-gray-500"} transition-all`}
                            style={{ width: `${era.positionPcts[pos] || 0}%` }}
                            title={`${pos}: ${era.positionPcts[pos]}%`}
                          />
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                        {CORE_POS_ORDER.filter((pos) => (era.positionPcts[pos] || 0) > 0).map((pos) => (
                          <span key={pos} className="text-gray-400">
                            <span className={`inline-block h-2 w-2 rounded-full ${POS_BG_SOLID[pos] || "bg-gray-500"} mr-1`} />
                            {pos} {era.positionPcts[pos]}%
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Avg first pick by position */}
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Avg First Pick Round</p>
                    <div className="grid grid-cols-3 gap-2">
                      {CORE_POS_ORDER.filter((pos) => era.avgFirstPick[pos]).map((pos) => (
                        <div key={pos} className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1">
                          <span className={`rounded-full border px-1.5 py-0 text-[8px] font-bold ${POS_COLORS[pos]}`}>{pos}</span>
                          <span className="font-mono text-xs text-white">{era.avgFirstPick[pos]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Trend arrows for key positions */}
              {profile.eraBreakdowns.length >= 2 && (
                <div className="mt-6 rounded-xl bg-[#0C2340] border border-white/10 p-4">
                  <p className="font-[family-name:var(--font-heading)] text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">Key Changes</p>
                  <div className="flex flex-wrap gap-3">
                    {CORE_POS_ORDER.map((pos) => {
                      const early = profile.eraBreakdowns[0].positionPcts[pos] || 0;
                      const recent = profile.eraBreakdowns[profile.eraBreakdowns.length - 1].positionPcts[pos] || 0;
                      const diff = recent - early;
                      if (Math.abs(diff) < 3) return null;
                      return (
                        <div key={pos} className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5">
                          <span className={`rounded-full border px-1.5 py-0 text-[8px] font-bold ${POS_COLORS[pos]}`}>{pos}</span>
                          <span className={`text-xs font-bold ${diff > 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {diff > 0 ? "+" : ""}{diff}%
                          </span>
                          <span className={`text-[10px] ${diff > 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {diff > 0 ? "▲" : "▼"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </Container>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SEASON FINISH TIMELINE */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {profile.scoutingReport.finishHistory.length > 0 && (
        <Container className="pt-0">
          <Card className="overflow-hidden">
            <CardHeader
              title="Season Performance"
              description="Finish position by year (top 3 tracked)"
            />
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {profile.scoutingReport.finishHistory.map((fh) => {
                  const finishColor =
                    fh.finish === "1st" ? "bg-[#DD550C]/20 border-[#DD550C]/40 text-[#DD550C]" :
                    fh.finish === "2nd" ? "bg-sky-500/20 border-sky-500/30 text-sky-300" :
                    fh.finish === "3rd" ? "bg-amber-500/20 border-amber-500/30 text-amber-300" :
                    "bg-white/5 border-white/10 text-gray-500";
                  return (
                    <div key={fh.year} className={`flex flex-col items-center rounded-xl border px-3 py-2 ${finishColor}`}>
                      <span className="font-[family-name:var(--font-heading)] text-sm font-bold">{fh.year}</span>
                      <span className="text-[10px] font-bold uppercase">{fh.finish === "N/A" ? "..." : fh.finish}</span>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </Container>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* RECENT PREMIUM PICKS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {profile.scoutingReport.recentPremiumPicks.length > 0 && (
        <Container className="pt-0">
          <Card className="overflow-hidden">
            <CardHeader
              title="Recent Premium Picks"
              description="Rounds 1-5 from the last 3 drafts"
            />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {profile.scoutingReport.recentPremiumPicks.map((rp) => {
                  const posClass = POS_COLORS[rp.pick.position] || "bg-white/10 text-gray-200 border-white/20";
                  return (
                    <div key={`${rp.year}-${rp.pick.pick}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 transition-colors">
                      <span className="font-[family-name:var(--font-heading)] font-mono text-sm font-bold text-[#DD550C] w-10">{rp.year}</span>
                      <span className="font-mono text-xs text-gray-500 w-8">R{rp.pick.round}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${posClass}`}>{rp.pick.position}</span>
                      <p className="font-semibold text-white flex-1">{rp.pick.playerName}</p>
                      <span className="text-xs text-gray-400">{rp.pick.nflTeam}</span>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </Container>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* EXISTING SECTIONS (original) */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Position Breakdown */}
          <Card className="overflow-hidden">
            <CardHeader title="Draft Tendencies" description="Position breakdown across all drafts" />
            <CardBody>
              <div className="space-y-3">
                {topPositions.map(([pos, count]) => {
                  const pct = totalPosPicks > 0 ? Math.round((count / totalPosPicks) * 100) : 0;
                  return (
                    <div key={pos}>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${POS_COLORS[pos] || "bg-white/10 text-gray-200 border-white/20"}`}>
                          {pos}
                        </span>
                        <span className="font-mono text-gray-300">{count} picks ({pct}%)</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#DD550C] to-[#ff8a3d]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Favorite NFL Teams */}
          <Card className="overflow-hidden">
            <CardHeader title="Favorite NFL Teams" description="Most drafted from across all seasons" />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {topNflTeams.map(([team, count], i) => (
                  <div key={team} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${
                      i < 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-gray-300"
                    }`}>{i + 1}</span>
                    <p className="font-semibold text-white flex-1">{team}</p>
                    <span className="font-mono text-sm text-gray-400">{count} picks</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* Team Name Evolution */}
      {profile.teamNames.length > 1 && (
        <Container className="pt-0">
          <Card className="overflow-hidden">
            <CardHeader title="Team Name Evolution" description="The rebrand history" />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {profile.teamNames.map((tn) => (
                  <div key={tn.year} className="flex items-center gap-4 px-5 py-2.5 hover:bg-white/5 transition-colors">
                    <span className="font-[family-name:var(--font-heading)] font-mono text-lg font-bold text-[#DD550C]">{tn.year}</span>
                    <p className="text-white">{tn.teamName}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Container>
      )}

      {/* First Round Picks History */}
      {profile.firstRoundPicks.length > 0 && (
        <Container className="pt-0">
          <Card className="overflow-hidden">
            <CardHeader
              title="First Round Picks"
              description={`${profile.firstRoundPicks.length} first rounders across ${profile.yearsActive.length} drafts`}
            />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {profile.firstRoundPicks.sort((a, b) => {
                  const yearA = profile.draftsByYear.find((d) => d.picks.includes(a));
                  const yearB = profile.draftsByYear.find((d) => d.picks.includes(b));
                  return (yearB?.year || 0) - (yearA?.year || 0);
                }).map((p) => {
                  const draftYear = profile.draftsByYear.find((d) => d.picks.some((dp) => dp.pick === p.pick && dp.playerKey === p.playerKey));
                  const posClass = POS_COLORS[p.position] || "bg-white/10 text-gray-200 border-white/20";
                  return (
                    <div key={`${draftYear?.year}-${p.pick}`} className={`flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 transition-colors ${p.isKeeper ? "border-l-2 border-l-amber-500/40" : ""}`}>
                      <span className="font-[family-name:var(--font-heading)] font-mono text-sm font-bold text-[#DD550C] w-10">{draftYear?.year}</span>
                      <span className="font-mono text-xs text-gray-500 w-8">#{p.pick}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${posClass}`}>{p.position}</span>
                      {p.isKeeper && <span className="rounded bg-amber-500/20 px-1 py-0 text-[8px] font-bold text-amber-300">K</span>}
                      <p className="font-semibold text-white flex-1">{p.playerName}</p>
                      <span className="text-xs text-gray-400">{p.nflTeam}</span>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </Container>
      )}

      {/* Full Draft History by Year */}
      <Container className="pt-0">
        <Card className="overflow-hidden">
          <CardHeader title="Complete Draft History" description="Every pick, every year" />
          <CardBody className="!p-0">
            {profile.draftsByYear.map((draft) => (
              <div key={draft.year}>
                <div className="bg-[#0C2340] px-5 py-2 border-t border-white/10">
                  <p className="font-[family-name:var(--font-heading)] text-sm font-bold uppercase tracking-wide text-[#DD550C]">
                    {draft.year} Draft
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {draft.picks.length} picks
                    </span>
                    {draft.picks.filter((p) => p.isKeeper).length > 0 && (
                      <span className="ml-2 text-xs font-normal text-amber-400">
                        {draft.picks.filter((p) => p.isKeeper).length} keepers
                      </span>
                    )}
                  </p>
                </div>
                <div className="divide-y divide-white/5">
                  {draft.picks.sort((a, b) => a.round - b.round).map((p) => {
                    const posClass = POS_COLORS[p.position] || "bg-white/10 text-gray-200 border-white/20";
                    return (
                      <div key={`${draft.year}-${p.pick}`} className={`flex items-center gap-2 px-5 py-1.5 text-sm hover:bg-white/5 transition-colors ${p.isKeeper ? "border-l-2 border-l-amber-500/40" : ""}`}>
                        <span className="font-mono text-[10px] text-gray-500 w-6">R{p.round}</span>
                        <span className="font-mono text-[10px] text-gray-500 w-8">#{p.pick}</span>
                        <span className={`rounded-full border px-1.5 py-0 text-[9px] font-bold ${posClass}`}>{p.position}</span>
                        {p.isKeeper && <span className="rounded bg-amber-500/20 px-1 py-0 text-[8px] font-bold text-amber-300">K</span>}
                        <span className="text-white flex-1 truncate">{p.playerName}</span>
                        <span className="text-xs text-gray-500">{p.nflTeam}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </Container>
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function StatCard({ label, value, highlight, keeper }: { label: string; value: string; highlight?: boolean; keeper?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#112d4e] p-4 text-center">
      <p className={`font-[family-name:var(--font-heading)] text-[10px] font-semibold uppercase tracking-[0.2em] ${keeper ? "text-amber-400" : "text-gray-400"}`}>{label}</p>
      <p className={`mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold ${highlight ? "text-gradient" : keeper ? "text-amber-300" : "text-white"}`}>{value}</p>
    </div>
  );
}

function TrophyBadge({ year, label, icon, highlight }: { year: number; label: string; icon: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 ${highlight ? "bg-[#DD550C]/10 border-[#DD550C]/30" : "bg-white/5 border-white/10"}`}>
      <span className="text-xl">{icon}</span>
      <div>
        <p className={`font-[family-name:var(--font-heading)] font-bold ${highlight ? "text-[#DD550C]" : "text-white"}`}>{year}</p>
        <p className="text-[10px] text-gray-400 uppercase">{label}</p>
      </div>
    </div>
  );
}

function DraftDNABar({ dna, totalDrafts }: { dna: DraftDNA; totalDrafts: number }) {
  const roundClass = dnaRoundClass(dna.avgFirstRound);
  const roundLabel = dnaRoundLabel(dna.avgFirstRound);
  const posClass = POS_COLORS[dna.position] || "bg-white/10 text-gray-200 border-white/20";
  const barWidth = Math.max(5, Math.min(100, ((17 - dna.avgFirstRound) / 16) * 100));

  return (
    <div className="flex items-center gap-3">
      <span className={`w-10 flex-shrink-0 rounded-full border px-2 py-0.5 text-center text-[10px] font-bold ${posClass}`}>
        {dna.position}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#DD550C] to-[#ff8a3d] transition-all"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${roundClass}`}>
            R{dna.avgFirstRound}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-500">
          <span>{roundLabel}</span>
          <span>&middot;</span>
          <span>{dna.yearsUsed}/{totalDrafts} drafts</span>
        </div>
      </div>
    </div>
  );
}

function DraftCapitalBar({ capital }: { capital: DraftCapital }) {
  const total = capital.premiumPicks + capital.midPicks + capital.latePicks;
  if (total === 0) return null;
  const posClass = POS_COLORS[capital.position] || "bg-white/10 text-gray-200 border-white/20";

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${posClass}`}>
          {capital.position}
        </span>
        <span className="text-xs text-gray-400">{total} total picks</span>
      </div>
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        {capital.premiumPicks > 0 && (
          <div
            className="bg-[#DD550C] flex items-center justify-center text-[9px] font-bold text-white"
            style={{ width: `${(capital.premiumPicks / total) * 100}%` }}
            title={`Premium (R1-5): ${capital.premiumPicks}`}
          >
            {capital.premiumPicks > 1 ? capital.premiumPicks : ""}
          </div>
        )}
        {capital.midPicks > 0 && (
          <div
            className="bg-sky-600 flex items-center justify-center text-[9px] font-bold text-white"
            style={{ width: `${(capital.midPicks / total) * 100}%` }}
            title={`Mid (R6-10): ${capital.midPicks}`}
          >
            {capital.midPicks > 1 ? capital.midPicks : ""}
          </div>
        )}
        {capital.latePicks > 0 && (
          <div
            className="bg-gray-600 flex items-center justify-center text-[9px] font-bold text-white"
            style={{ width: `${(capital.latePicks / total) * 100}%` }}
            title={`Late (R11-16): ${capital.latePicks}`}
          >
            {capital.latePicks > 1 ? capital.latePicks : ""}
          </div>
        )}
      </div>
      <div className="mt-1 flex gap-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#DD550C]" />R1-5: {capital.premiumPicks}</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-sky-600" />R6-10: {capital.midPicks}</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-gray-600" />R11-16: {capital.latePicks}</span>
      </div>
    </div>
  );
}

/** Map position + intensity to rgba color for heatmap */
function getHeatColor(pos: string, intensity: number): string {
  const alpha = 0.15 + intensity * 0.85;
  const colors: Record<string, string> = {
    QB: `rgba(244, 63, 94, ${alpha})`,   // rose
    RB: `rgba(16, 185, 129, ${alpha})`,  // emerald
    WR: `rgba(14, 165, 233, ${alpha})`,  // sky
    TE: `rgba(245, 158, 11, ${alpha})`,  // amber
    K: `rgba(139, 92, 246, ${alpha})`,   // violet
    DEF: `rgba(100, 116, 139, ${alpha})`, // slate
  };
  return colors[pos] || `rgba(255, 255, 255, ${alpha})`;
}
