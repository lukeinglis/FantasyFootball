import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildManagerProfile, slugToName, getAllManagerNames, getManagerSlug } from "@/lib/managers";
import type { DraftDNA, DraftCapital, EraBreakdown, HeatmapCell } from "@/lib/managers";
import {
  getManagerCareerStats,
  getManagerPersonalRecords,
  getManagerSeasonBreakdowns,
} from "@/lib/manager-stats";
import type { PersonalRecord } from "@/lib/manager-stats";
import PageHeader from "@/components/PageHeader";
import SectionHeading from "@/components/SectionHeading";
import { POS_COLORS, POS_FILL } from "@/lib/records";
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

/**
 * Draft DNA round badges. Early / mid / late is an ordered scale, so it is set
 * as one of ink weight rather than three unrelated hues: the earlier the pick,
 * the heavier the badge. The old "late" badge was dark grey filled with dark
 * grey text and could not be read at all.
 */
function dnaRoundClass(avg: number): string {
  if (avg <= 3) return "bg-ink text-white";
  if (avg <= 8) return "bg-ink-muted text-white";
  return "border border-rule bg-paper text-ink-muted";
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

  const careerStats = getManagerCareerStats(slug);
  const personalRecords = getManagerPersonalRecords(slug);
  const seasonBreakdowns = getManagerSeasonBreakdowns(slug);

  const recordCards = [
    personalRecords.highestWeekScore,
    personalRecords.lowestWeekScore,
    personalRecords.biggestWinMargin,
    personalRecords.closestLoss,
    personalRecords.longestWinStreak,
    personalRecords.longestLossStreak,
  ].filter((r): r is PersonalRecord => r !== null);

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
          className="border border-rule px-3 py-1.5 text-xs text-ink-soft hover:bg-paper"
        >
          All Managers
        </Link>
      </PageHeader>

      <Container>
        {/* Six counts, in a strip that divides evenly at every width: three
            across on a phone, six across on a desktop. It was seven, because
            "First Active" and "Last Active" were separate tiles. They are one
            fact, so they read better as a span, and folding them together
            takes the strip from four rows on a 390px screen down to two. */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Seasons" value={String(profile.yearsActive.length)} />
          <StatCard label="Titles" value={String(profile.championships)} title={profile.championships > 0} />
          <StatCard label="Podiums" value={String(podiumTotal)} />
          <StatCard label="Picks" value={profile.totalPicks.toLocaleString()} />
          <StatCard label="Keepers" value={String(keeperCount)} />
          <StatCard
            label="Active"
            value={`${Math.min(...profile.yearsActive)}\u2013${Math.max(...profile.yearsActive)}`}
          />
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
                  <TrophyBadge key={`champ-${y}`} year={y} label="Champion"  highlight />
                ))}
                {profile.runnerUpYears.map((y) => (
                  <TrophyBadge key={`ru-${y}`} year={y} label="Runner-Up" />
                ))}
                {profile.thirdPlaceYears.map((y) => (
                  <TrophyBadge key={`3rd-${y}`} year={y} label="Third" />
                ))}
              </div>
            </CardBody>
          </Card>
        </Container>
      )}

      {/* Career Stats */}
      {careerStats && careerStats.seasonsPlayed > 0 && (
        <Container className="pt-0">
          <SectionHeading title="Career Stats" note="Every regular-season and playoff game on record" />
          {/* Four tiles, down from six. Wins and Losses were separate tiles,
              but a W-L record is one fact and is written as one everywhere
              else on the site; and "Championships" repeated the "Titles" tile
              in the strip at the top of this same page. Four divides evenly
              two across on a phone and four across on a desktop, and every
              label fits on one line at both widths, so the values sit on a
              common baseline. */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <CareerStatTile
              label="Record"
              value={`${careerStats.wins}\u2013${careerStats.losses}${careerStats.ties > 0 ? `\u2013${careerStats.ties}` : ""}`}
            />
            <CareerStatTile label="Win %" value={`${careerStats.winPct}%`} />
            {/* "Points For" rather than "Points Scored", to match the PF/PA
                columns in the season ledger further down the page. */}
            <CareerStatTile label="Points For" value={careerStats.totalPointsFor.toLocaleString()} />
            <CareerStatTile label="Points Against" value={careerStats.totalPointsAgainst.toLocaleString()} />
          </div>
        </Container>
      )}

      {/* Personal Records */}
      {recordCards.length > 0 && (
        <Container className="pt-0">
          <SectionHeading title="Personal Records" note="Best and worst single weeks for this manager" />
          {/* Two across on a phone. One per row meant five short numbers ran
              past a full screen of scrolling. */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            {recordCards.map((record) => (
              <PersonalRecordTile key={record.label} record={record} />
            ))}
          </div>
        </Container>
      )}

      {/* Season by Season */}
      {seasonBreakdowns.length > 0 && (
        <Container className="pt-0">
          <SectionHeading title="Season by Season" note="Full year-by-year ledger" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-rule text-ink-muted uppercase text-xs tracking-wide">
                  <th className="py-3 pr-4">Year</th>
                  <th className="hidden py-3 pr-4 sm:table-cell">Team</th>
                  <th className="py-3 pr-4 text-center">Record</th>
                  <th className="py-3 pr-4 text-right">PF</th>
                  <th className="hidden py-3 pr-4 text-right sm:table-cell">PA</th>
                  <th className="py-3 pr-4 text-center">Finish</th>
                  <th className="py-3 text-center">Playoffs</th>
                </tr>
              </thead>
              <tbody>
                {seasonBreakdowns.map((s) => {
                  const isChamp = s.playoffResult === "Champion";
                  return (
                    <tr
                      key={s.year}
                      className={`border-b border-rule ${isChamp ? "bg-result/5" : ""}`}
                    >
                      <td className="py-3 pr-4 font-medium text-ink">{s.year}</td>
                      <td className="hidden py-3 pr-4 text-ink-soft sm:table-cell">{s.teamName}</td>
                      <td className="py-3 pr-4 text-center text-ink-soft">
                        {s.wins}-{s.losses}{s.ties > 0 ? `-${s.ties}` : ""}
                      </td>
                      <td className="py-3 pr-4 text-right text-ink-soft">{s.pointsFor.toLocaleString()}</td>
                      <td className="hidden py-3 pr-4 text-right text-ink-soft sm:table-cell">{s.pointsAgainst.toLocaleString()}</td>
                      {/* Weight, not hue. Red already means Champion in the
                          next column, so painting a 10th-place finish red put
                          two opposite meanings on one row. A top-three finish
                          gets full ink, a bottom-three finish recedes. */}
                      <td className="py-3 pr-4 text-center tabular-nums">
                        <span
                          className={
                            s.rank <= 3
                              ? "font-semibold text-ink"
                              : s.rank >= 10
                                ? "text-ink-faint"
                                : "text-ink-soft"
                          }
                        >
                          #{s.rank}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        {isChamp && <span className="text-result font-semibold">Champion</span>}
                        {s.playoffResult === "Runner-up" && <span className="text-ink-soft">Runner-up</span>}
                        {s.playoffResult === "3rd Place" && <span className="text-ink-soft">3rd Place</span>}
                        {s.playoffResult === "Playoffs" && <span className="text-ink-muted">Playoffs</span>}
                        {s.playoffResult === "Did not qualify" && <span className="text-ink-muted">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Container>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SCOUTING REPORT */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Container className="pt-0">
        <Card className="overflow-hidden border-result/20">
          <CardHeader
            title="Scouting Report"
            description={`How to prepare when drafting against ${profile.name}`}
          />
          <CardBody>
            {/* Archetype badge */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center bg-result/10 border border-result/30">
                <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-result">
                  {profile.scoutingReport.archetype.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-[family-name:var(--font-heading)] text-xl font-bold text-result uppercase tracking-wide">
                  {profile.scoutingReport.archetype}
                </p>
                <p className="text-sm text-ink-soft">{profile.scoutingReport.archetypeDescription}</p>
              </div>
            </div>

            {/* Scouting report. The two columns are a ledger of pluses against
                minuses, so the marker is the sign itself rather than a coloured
                dot: it says which column you are in even in greyscale. The old
                tinted panels were styled for a dark background and washed out
                to almost nothing on paper. */}
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.scoutingReport.strengths.length > 0 && (
                <div className="border border-rule">
                  <div className="h-[3px] bg-record" />
                  <div className="p-4">
                    <p className="mb-3 font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.16em] text-ink-muted">Strengths</p>
                    <ul className="space-y-2 text-sm">
                      {profile.scoutingReport.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span aria-hidden className="mt-px font-[family-name:var(--wire-mono)] text-[13px] leading-[1.5] text-record">+</span>
                          <span className="leading-[1.5] text-ink-soft">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {profile.scoutingReport.weaknesses.length > 0 && (
                <div className="border border-rule">
                  <div className="h-[3px] bg-result" />
                  <div className="p-4">
                    <p className="mb-3 font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.16em] text-ink-muted">Exploitable Weaknesses</p>
                    <ul className="space-y-2 text-sm">
                      {profile.scoutingReport.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span aria-hidden className="mt-px font-[family-name:var(--wire-mono)] text-[13px] leading-[1.5] text-result">&minus;</span>
                          <span className="leading-[1.5] text-ink-soft">{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Championship probability */}
            <div className="mt-4 flex items-center gap-3 bg-paper border border-rule p-3">
              <span className="font-[family-name:var(--font-heading)] text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">Championship Rate</span>
              <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-ink">{profile.scoutingReport.championshipProbability}%</span>
              <span className="text-xs text-ink-muted">({profile.championships} {profile.championships === 1 ? "title" : "titles"} in {profile.yearsActive.length} seasons)</span>
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
              <div className="mb-6 bg-surface border border-rule p-4">
                <p className="text-sm leading-relaxed text-ink-soft italic">
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
                  <tr className="border-b border-rule">
                    <th className="sticky left-0 bg-surface px-3 py-2 text-left font-[family-name:var(--font-heading)] text-[10px] uppercase tracking-[0.15em] text-ink-muted">
                      Round
                    </th>
                    {CORE_POS_ORDER.map((pos) => (
                      <th key={pos} className="px-2 py-2">
                        <span className={`inline-block border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[pos] || "bg-paper text-ink-soft border-rule"}`}>
                          {pos}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxRound }, (_, i) => i + 1).map((round) => (
                    <tr key={round} className="border-b border-rule hover:bg-paper transition-colors">
                      <td className="sticky left-0 bg-surface px-3 py-1.5 text-left font-mono text-ink-muted">
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
                                className="inline-flex h-7 w-7 items-center justify-center font-mono font-bold"
                                style={heatStyle(intensity)}
                              >
                                {count}
                              </span>
                            ) : (
                              <span className="text-ink-faint">&middot;</span>
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
                  <div key={era.era} className="bg-paper border border-rule p-4">
                    <p className="font-[family-name:var(--font-heading)] text-sm font-bold text-result uppercase tracking-wide mb-3">
                      {era.era}
                    </p>

                    {/* Position mix */}
                    <div className="mb-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-2">Position Mix</p>
                      <div className="flex h-5 w-full overflow-hidden ">
                        {CORE_POS_ORDER.filter((pos) => (era.positionPcts[pos] || 0) > 0).map((pos) => (
                          <div
                            key={pos}
                            className={`${POS_FILL[pos] || "bg-gray-500"} transition-all`}
                            style={{ width: `${era.positionPcts[pos] || 0}%` }}
                            title={`${pos}: ${era.positionPcts[pos]}%`}
                          />
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                        {CORE_POS_ORDER.filter((pos) => (era.positionPcts[pos] || 0) > 0).map((pos) => (
                          <span key={pos} className="text-ink-muted">
                            <span className={`inline-block h-2 w-2 ${POS_FILL[pos] || "bg-gray-500"} mr-1`} />
                            {pos} {era.positionPcts[pos]}%
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Avg first pick by position */}
                    <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-2">Avg First Pick Round</p>
                    <div className="grid grid-cols-3 gap-2">
                      {CORE_POS_ORDER.filter((pos) => era.avgFirstPick[pos]).map((pos) => (
                        <div key={pos} className="flex items-center gap-1.5 bg-paper px-2 py-1">
                          <span className={`border px-1.5 py-0 text-[8px] font-bold ${POS_COLORS[pos]}`}>{pos}</span>
                          <span className="font-mono text-xs text-ink">{era.avgFirstPick[pos]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Trend arrows for key positions */}
              {profile.eraBreakdowns.length >= 2 && (
                <div className="mt-6 bg-surface border border-rule p-4">
                  <p className="font-[family-name:var(--font-heading)] text-xs font-bold uppercase tracking-[0.2em] text-ink-muted mb-3">Key Changes</p>
                  <div className="flex flex-wrap gap-3">
                    {CORE_POS_ORDER.map((pos) => {
                      const early = profile.eraBreakdowns[0].positionPcts[pos] || 0;
                      const recent = profile.eraBreakdowns[profile.eraBreakdowns.length - 1].positionPcts[pos] || 0;
                      const diff = recent - early;
                      if (Math.abs(diff) < 3) return null;
                      return (
                        <div key={pos} className="flex items-center gap-1.5 bg-paper border border-rule px-3 py-1.5">
                          <span className={`border px-1.5 py-0 text-[8px] font-bold ${POS_COLORS[pos]}`}>{pos}</span>
                          <span className={`font-[family-name:var(--wire-mono)] text-xs font-bold tabular-nums ${diff > 0 ? "text-money" : "text-result"}`}>
                            {diff > 0 ? "+" : ""}{diff}%
                          </span>
                          <span className={`text-[10px] ${diff > 0 ? "text-money" : "text-result"}`}>
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
                    fh.finish === "1st" ? "bg-result/20 border-result/40 text-result" :
                    fh.finish === "2nd" ? "bg-ink border-ink text-white" :
                    fh.finish === "3rd" ? "bg-rule border-ink-faint text-ink" :
                    "bg-paper border-rule text-ink-muted";
                  return (
                    <div key={fh.year} className={`flex flex-col items-center border px-3 py-2 ${finishColor}`}>
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
              <div className="divide-y divide-rule">
                {profile.scoutingReport.recentPremiumPicks.map((rp) => {
                  const posClass = POS_COLORS[rp.pick.position] || "bg-paper text-ink-soft border-rule";
                  return (
                    <div key={`${rp.year}-${rp.pick.pick}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors">
                      <span className="font-[family-name:var(--font-heading)] font-mono text-sm font-bold text-result w-10">{rp.year}</span>
                      <span className="font-mono text-xs text-ink-muted w-8">R{rp.pick.round}</span>
                      <span className={`border px-2 py-0.5 text-[10px] font-bold ${posClass}`}>{rp.pick.position}</span>
                      <p className="font-semibold text-ink flex-1">{rp.pick.playerName}</p>
                      <span className="text-xs text-ink-muted">{rp.pick.nflTeam}</span>
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
                        <span className={`border px-2 py-0.5 text-[10px] font-bold ${POS_COLORS[pos] || "bg-paper text-ink-soft border-rule"}`}>
                          {pos}
                        </span>
                        <span className="font-mono text-ink-soft">{count} picks ({pct}%)</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden bg-paper">
                        <div
                          className="h-full bg-ink-soft"
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
              <div className="divide-y divide-rule">
                {topNflTeams.map(([team, count], i) => (
                  <div key={team} className="flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-xs font-bold ${
 i < 3 ? "bg-result text-white" : "bg-paper text-ink-soft"
                    }`}>{i + 1}</span>
                    <p className="font-semibold text-ink flex-1">{team}</p>
                    <span className="font-mono text-sm text-ink-muted">{count} picks</span>
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
              <div className="divide-y divide-rule">
                {profile.teamNames.map((tn) => (
                  <div key={tn.year} className="flex items-center gap-4 px-5 py-2.5 hover:bg-paper transition-colors">
                    <span className="font-[family-name:var(--font-heading)] font-mono text-lg font-bold text-result">{tn.year}</span>
                    <p className="text-ink">{tn.teamName}</p>
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
              <div className="divide-y divide-rule">
                {profile.firstRoundPicks.sort((a, b) => {
                  const yearA = profile.draftsByYear.find((d) => d.picks.includes(a));
                  const yearB = profile.draftsByYear.find((d) => d.picks.includes(b));
                  return (yearB?.year || 0) - (yearA?.year || 0);
                }).map((p) => {
                  const draftYear = profile.draftsByYear.find((d) => d.picks.some((dp) => dp.pick === p.pick && dp.playerKey === p.playerKey));
                  const posClass = POS_COLORS[p.position] || "bg-paper text-ink-soft border-rule";
                  return (
                    <div key={`${draftYear?.year}-${p.pick}`} className={`flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors ${p.isKeeper ? "border-l-2 border-l-amber-500/40" : ""}`}>
                      <span className="font-[family-name:var(--font-heading)] font-mono text-sm font-bold text-result w-10">{draftYear?.year}</span>
                      <span className="font-mono text-xs text-ink-muted w-8">#{p.pick}</span>
                      <span className={`border px-2 py-0.5 text-[10px] font-bold ${posClass}`}>{p.position}</span>
                      {p.isKeeper && <span className="bg-record/15 px-1 py-0 text-[8px] font-bold text-record">K</span>}
                      <p className="font-semibold text-ink flex-1">{p.playerName}</p>
                      <span className="text-xs text-ink-muted">{p.nflTeam}</span>
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
                <div className="bg-surface px-5 py-2 border-t border-rule">
                  <p className="font-[family-name:var(--font-heading)] text-sm font-bold uppercase tracking-wide text-result">
                    {draft.year} Draft
                    <span className="ml-2 text-xs font-normal text-ink-muted">
                      {draft.picks.length} picks
                    </span>
                    {draft.picks.filter((p) => p.isKeeper).length > 0 && (
                      <span className="ml-2 text-xs font-normal text-record">
                        {draft.picks.filter((p) => p.isKeeper).length} keepers
                      </span>
                    )}
                  </p>
                </div>
                <div className="divide-y divide-rule">
                  {draft.picks.sort((a, b) => a.round - b.round).map((p) => {
                    const posClass = POS_COLORS[p.position] || "bg-paper text-ink-soft border-rule";
                    return (
                      <div key={`${draft.year}-${p.pick}`} className={`flex items-center gap-2 px-5 py-1.5 text-sm hover:bg-paper transition-colors ${p.isKeeper ? "border-l-2 border-l-amber-500/40" : ""}`}>
                        <span className="font-mono text-[10px] text-ink-muted w-6">R{p.round}</span>
                        <span className="font-mono text-[10px] text-ink-muted w-8">#{p.pick}</span>
                        <span className={`border px-1.5 py-0 text-[9px] font-bold ${posClass}`}>{p.position}</span>
                        {p.isKeeper && <span className="bg-record/15 px-1 py-0 text-[8px] font-bold text-record">K</span>}
                        <span className="text-ink flex-1 truncate">{p.playerName}</span>
                        <span className="text-xs text-ink-muted">{p.nflTeam}</span>
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

/**
 * All four career tiles are set in ink. There used to be a `highlight` prop,
 * and "Win %" passed it unconditionally, so a 42% career record came out in
 * championship red.
 */
function CareerStatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="scoreboard">
      {/* Label over value, matching the quick-stats strip higher up the page.
          These tiles used to put the value first, so two strips of the same
          kind of number read in opposite directions. */}
      <CardBody className="px-2 py-3 text-center sm:px-4 sm:py-4">
        <p className="font-[family-name:var(--wire-mono)] text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted sm:tracking-[0.2em]">{label}</p>
        <p className="mt-1 font-[family-name:var(--wire-display)] text-xl font-extrabold tabular-nums text-ink sm:text-2xl">{value}</p>
      </CardBody>
    </Card>
  );
}

function PersonalRecordTile({ record }: { record: PersonalRecord }) {
  const isStreak = record.label.includes("Streak");
  return (
    <Card variant="chalkboard">
      <CardBody className="px-3 py-4 sm:px-4">
        {/* Gold on every label made "Longest Loss Streak" look like an award.
            The label is a caption; the number is the record. */}
        <p className="font-[family-name:var(--wire-mono)] text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted sm:tracking-[0.14em]">{record.label}</p>
        <p className="mt-1 font-[family-name:var(--wire-display)] text-xl font-extrabold tabular-nums text-ink sm:text-2xl">
          {isStreak ? `${record.value} games` : `${record.value} pts`}
        </p>
        <p className="mt-1 text-xs text-ink-faint">{record.detail}</p>
      </CardBody>
    </Card>
  );
}

/**
 * One tile in the seven-across strip at the top of a manager page.
 *
 * These are seven counts of the same kind, so they are set the same way. The
 * earlier version ringed every tile in gold and had two separate props,
 * `highlight` and `keeper`, that both resolved to the same gold text, which
 * meant "Keepers 4" and "Titles 2" shouted equally and "Seasons 11" beside
 * them did not. A title is the one genuinely rare fact in the row, so it is
 * the only one that gets colour.
 */
function StatCard({ label, value, title }: { label: string; value: string; title?: boolean }) {
  return (
    <div className="border border-rule bg-surface px-2 py-3 text-center sm:px-4 sm:py-4">
      {/* The tracking comes off on a phone: at 0.2em "KEEPERS" alone is wider
          than a third of a 390px screen and wraps. */}
      <p className="font-[family-name:var(--wire-mono)] text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted sm:tracking-[0.2em]">{label}</p>
      <p className={`mt-1 font-[family-name:var(--wire-display)] text-xl font-extrabold tabular-nums sm:text-2xl ${title ? "text-result" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function TrophyBadge({ year, label, highlight }: { year: number; label: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-2 border px-4 py-2 ${highlight ? "bg-result/10 border-result/30" : "bg-paper border-rule"}`}>
      <div>
        <p className={`font-[family-name:var(--font-heading)] font-bold ${highlight ? "text-result" : "text-ink"}`}>{year}</p>
        <p className="text-[10px] text-ink-muted uppercase">{label}</p>
      </div>
    </div>
  );
}

function DraftDNABar({ dna, totalDrafts }: { dna: DraftDNA; totalDrafts: number }) {
  const roundClass = dnaRoundClass(dna.avgFirstRound);
  const roundLabel = dnaRoundLabel(dna.avgFirstRound);
  const posClass = POS_COLORS[dna.position] || "bg-paper text-ink-soft border-rule";
  const barWidth = Math.max(5, Math.min(100, ((17 - dna.avgFirstRound) / 16) * 100));

  return (
    <div className="flex items-center gap-3">
      <span className={`w-10 flex-shrink-0 border px-2 py-0.5 text-center text-[10px] font-bold ${posClass}`}>
        {dna.position}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 overflow-hidden bg-paper">
            <div
              className="h-full bg-ink-soft transition-all"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-bold ${roundClass}`}>
            R{dna.avgFirstRound}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-ink-muted">
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
  const posClass = POS_COLORS[capital.position] || "bg-paper text-ink-soft border-rule";

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className={`border px-2 py-0.5 text-[10px] font-bold ${posClass}`}>
          {capital.position}
        </span>
        <span className="text-xs text-ink-muted">{total} total picks</span>
      </div>
      <div className="flex h-4 w-full overflow-hidden ">
        {capital.premiumPicks > 0 && (
          <div
            className="bg-result flex items-center justify-center text-[9px] font-bold text-white"
            style={{ width: `${(capital.premiumPicks / total) * 100}%` }}
            title={`Premium (R1-5): ${capital.premiumPicks}`}
          >
            {capital.premiumPicks > 1 ? capital.premiumPicks : ""}
          </div>
        )}
        {capital.midPicks > 0 && (
          <div
            className="bg-ink-muted flex items-center justify-center text-[9px] font-bold text-white"
            style={{ width: `${(capital.midPicks / total) * 100}%` }}
            title={`Mid (R6-10): ${capital.midPicks}`}
          >
            {capital.midPicks > 1 ? capital.midPicks : ""}
          </div>
        )}
        {capital.latePicks > 0 && (
          <div
            className="bg-ink-faint flex items-center justify-center text-[9px] font-bold text-ink"
            style={{ width: `${(capital.latePicks / total) * 100}%` }}
            title={`Late (R11-16): ${capital.latePicks}`}
          >
            {capital.latePicks > 1 ? capital.latePicks : ""}
          </div>
        )}
      </div>
      <div className="mt-1 flex gap-3 text-[10px] text-ink-muted">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 bg-result" />R1-5: {capital.premiumPicks}</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 bg-ink-muted" />R6-10: {capital.midPicks}</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 bg-ink-faint" />R11-16: {capital.latePicks}</span>
      </div>
    </div>
  );
}

/**
 * Heat for one cell of the round-by-position grid.
 *
 * The count is the only thing that varies inside a column, so the cell darkens
 * with the count and nothing else. The old version tinted each column by
 * position, which restated the header the column already carries, and it set
 * every cell's text to white: a "1" came out white-on-almost-white and could
 * not be read at all. The coloured position chips across the header still
 * anchor each column.
 */
function heatStyle(intensity: number): { backgroundColor: string; color: string } {
  return {
    backgroundColor: `rgba(15, 21, 33, ${0.08 + intensity * 0.92})`,
    color: intensity > 0.55 ? "#fff" : "#0f1521",
  };
}
