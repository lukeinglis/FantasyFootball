import Link from "next/link";
import { computeLeagueAnalytics, getManagerSlug } from "@/lib/managers";
import Container from "@/components/Container";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { POS_COLORS, POS_FILL } from "@/lib/records";

const CORE_POS_ORDER = ["QB", "RB", "WR", "TE", "K", "DEF"];
const SKILL_POSITIONS = ["QB", "RB", "WR", "TE"];

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    // Four counts of the same kind. A gold 3px ring on each made them look
    // like four separate awards rather than one row of totals.
    <div className="border border-rule bg-surface p-4 text-center">
      <p className="font-[family-name:var(--wire-mono)] text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">{label}</p>
      <p className="mt-1 font-[family-name:var(--wire-display)] text-2xl font-extrabold tabular-nums text-ink">{value}</p>
    </div>
  );
}

export default function DraftInsightsContent() {
  const analytics = computeLeagueAnalytics();

  const archetypeCounts: Record<string, number> = {};
  for (const a of analytics.archetypes) {
    archetypeCounts[a.archetype] = (archetypeCounts[a.archetype] || 0) + 1;
  }
  const archetypeEntries = Object.entries(archetypeCounts).sort((a, b) => b[1] - a[1]);

  const champR1Counts: Record<string, number> = {};
  for (const cp of analytics.championProfiles) {
    if (cp.round1Position !== "N/A") {
      champR1Counts[cp.round1Position] = (champR1Counts[cp.round1Position] || 0) + 1;
    }
  }

  const topTeams = analytics.nflTeamPopularity.slice(0, 15);
  const maxTeamPicks = topTeams.length > 0 ? topTeams[0].totalPicks : 1;

  return (
    <>
      <Container>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickStat label="Total Picks" value={analytics.totalPicks.toLocaleString()} />
          <QuickStat label="Drafts" value={String(analytics.totalDrafts)} />
          <QuickStat label="Managers" value={String(analytics.totalManagers)} />
          <QuickStat label="NFL Teams" value={String(analytics.nflTeamPopularity.length)} />
        </div>
      </Container>

      <Container className="pt-0">
        <Card className="overflow-hidden">
          <CardHeader
            title="Round 1 Position Breakdown by Year"
            description="How the league's first-round strategy has evolved (% of R1 picks by position)"
          />
          <CardBody className="!p-0 overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-rule">
                  <th className="sticky left-0 bg-surface px-3 py-2 text-left font-[family-name:var(--font-heading)] text-[10px] uppercase tracking-[0.15em] text-ink-muted">
                    Year
                  </th>
                  {SKILL_POSITIONS.map((pos) => (
                    <th key={pos} className="px-3 py-2">
                      <span className={`inline-block border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[pos]}`}>
                        {pos}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analytics.positionByYear.map((pby) => (
                  <tr key={pby.year} className="border-b border-rule hover:bg-paper transition-colors">
                    <td className="sticky left-0 bg-surface px-3 py-2 text-left font-[family-name:var(--wire-mono)] text-sm font-bold tabular-nums text-ink">
                      {pby.year}
                    </td>
                    {SKILL_POSITIONS.map((pos) => {
                      const pct = pby.round1Pcts[pos] || 0;
                      return (
                        <td key={pos} className="px-3 py-2">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-12 h-3 bg-paper overflow-hidden">
                              <div
                                className={`h-full ${POS_FILL[pos]}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`font-mono text-[10px] ${pct > 0 ? "text-ink-soft" : "text-ink-muted"}`}>
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

      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
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
                        <span className="text-sm font-semibold text-ink">{archetype}</span>
                        <span className="font-[family-name:var(--wire-mono)] text-xs tabular-nums text-ink-muted">
                          {count} {count === 1 ? "manager" : "managers"} ({pct}%)
                        </span>
                      </div>
                      {/* The bar's length already carries the share. Painting
                          every one of them red added a second encoding that
                          said nothing the number had not already said. */}
                      <div className="h-2.5 w-full overflow-hidden bg-paper">
                        <div
                          className="h-full bg-ink-soft"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                {analytics.archetypes.map((a) => (
                  <Link
                    key={a.name}
                    href={`/managers/${a.slug}`}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-paper transition-colors"
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center border border-ink bg-paper font-[family-name:var(--wire-display)] text-xs font-extrabold uppercase text-ink">
                      {a.name.charAt(0)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{a.name}</p>
                      <p className="text-[10px] text-ink-muted">{a.archetype}</p>
                    </div>
                    {a.draftDNA.length > 0 && (
                      <span className={`border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[a.draftDNA[0].position]}`}>
                        {a.draftDNA[0].position} R{a.draftDNA[0].avgFirstRound}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="What Champions Draft"
              description="Round 1 position choices of title winners"
            />
            <CardBody>
              <div className="mb-6 bg-surface border border-rule p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-3">Champion Round 1 Picks</p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(champR1Counts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([pos, count]) => (
                      <div key={pos} className="flex items-center gap-2 bg-paper border border-rule px-3 py-2">
                        <span className={`border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[pos]}`}>{pos}</span>
                        <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-ink">{count}</span>
                        <span className="text-[10px] text-ink-muted">titles</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="divide-y divide-rule">
                {analytics.championProfiles.map((cp) => (
                  <div key={cp.year} className="flex items-center gap-3 py-2.5 hover:bg-paper transition-colors px-1 ">
                    <span className="font-[family-name:var(--wire-mono)] text-sm font-bold tabular-nums text-ink w-10">{cp.year}</span>
                    <Link
                      href={`/managers/${getManagerSlug(cp.champion)}`}
                      className="text-sm font-semibold text-ink hover:text-result transition-colors flex-1"
                    >
                      {cp.champion}
                    </Link>
                    {cp.round1Position !== "N/A" && (
                      <span className={`border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[cp.round1Position]}`}>
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
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-xs font-bold ${
 i < 3 ? "bg-result text-white" : "bg-paper text-ink-soft"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="w-12 text-sm font-bold text-ink">{team.team}</span>
                    <div className="flex-1">
                      <div className="h-3 w-full overflow-hidden bg-paper">
                        <div
                          className="h-full bg-result transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-mono text-xs text-ink-muted w-16 text-right">{team.totalPicks} picks</span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </Container>

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
                        <span className={`border px-2 py-0.5 text-[10px] font-bold ${POS_COLORS[ps.position]}`}>
                          {ps.position}
                        </span>
                        <span className="text-xs text-ink-muted">
                          First pick avg: <span className="text-ink font-bold">R{ps.avgFirstRound}</span>
                        </span>
                        <span className="text-xs text-ink-muted">
                          Last pick avg: <span className="text-ink font-bold">R{ps.avgLastRound}</span>
                        </span>
                      </div>

                      <div className="flex items-end gap-0.5 h-12">
                        {Array.from({ length: 16 }, (_, i) => i + 1).map((round) => {
                          const dist = ps.pickDistribution.find((d) => d.round === round);
                          const count = dist?.count || 0;
                          const height = count > 0 ? Math.max(4, (count / maxCount) * 48) : 0;
                          return (
                            <div key={round} className="flex-1 flex flex-col items-center justify-end" title={`R${round}: ${count} picks`}>
                              {count > 0 && (
                                <div
                                  className={`w-full ${POS_FILL[ps.position]} opacity-70 hover:opacity-100 transition-opacity`}
                                  style={{ height: `${height}px` }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from({ length: 16 }, (_, i) => i + 1).map((round) => (
                          <span key={round} className="flex-1 text-center text-[8px] text-ink-muted">
                            {round}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}

              <div className="grid grid-cols-2 gap-4">
                {analytics.positionScarcity
                  .filter((ps) => ps.position === "K" || ps.position === "DEF")
                  .map((ps) => (
                    <div key={ps.position} className="bg-paper border border-rule p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[ps.position]}`}>
                          {ps.position}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-ink-muted">Avg first:</span>
                          <span className="ml-1 text-ink font-bold">R{ps.avgFirstRound}</span>
                        </div>
                        <div>
                          <span className="text-ink-muted">Avg last:</span>
                          <span className="ml-1 text-ink font-bold">R{ps.avgLastRound}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </Container>

      <Container className="pt-0">
        <Card className="overflow-hidden">
          <CardHeader
            title="Draft DNA Comparison"
            description="Every manager's average first-pick round per position, side by side"
          />
          <CardBody className="!p-0 overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-rule">
                  <th className="sticky left-0 bg-surface px-3 py-2 text-left font-[family-name:var(--font-heading)] text-[10px] uppercase tracking-[0.15em] text-ink-muted min-w-[100px]">
                    Manager
                  </th>
                  {CORE_POS_ORDER.map((pos) => (
                    <th key={pos} className="px-2 py-2">
                      <span className={`inline-block border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[pos]}`}>
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
                    <tr key={mgr.name} className="border-b border-rule hover:bg-paper transition-colors">
                      <td className="sticky left-0 bg-surface px-3 py-1.5 text-left">
                        <Link
                          href={`/managers/${mgr.slug}`}
                          className="text-sm font-semibold text-ink hover:text-result transition-colors"
                        >
                          {mgr.name}
                        </Link>
                      </td>
                      {CORE_POS_ORDER.map((pos) => {
                        const dna = mgr.draftDNA.find((d) => d.position === pos);
                        if (!dna) return <td key={pos} className="px-2 py-1.5 text-ink">&middot;</td>;
                        const roundClass =
                          dna.avgFirstRound <= 3 ? "bg-ink font-bold text-white" :
                          dna.avgFirstRound <= 8 ? "bg-rule text-ink" :
                          "text-ink-muted";
                        return (
                          <td key={pos} className="px-2 py-1.5">
                            <span className={`inline-block px-2 py-0.5 font-mono text-[11px] ${roundClass}`}>
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
