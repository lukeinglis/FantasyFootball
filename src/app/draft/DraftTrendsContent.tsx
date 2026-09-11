import Link from "next/link";
import { computeDraftTrends } from "@/lib/draft-trends";
import { getManagerSlug } from "@/lib/managers";
import Container from "@/components/Container";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { POS_COLORS, POS_FILL } from "@/lib/records";

const SKILL_POSITIONS = ["QB", "RB", "WR", "TE"];

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    // Four counts of the same kind. A gold 3px ring on each made them look
    // like four separate awards rather than one row of totals.
    <div className="border border-rule bg-surface p-4 text-center">
      <p className="font-[family-name:var(--wire-mono)] text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--wire-display)] text-2xl font-extrabold tabular-nums text-ink">
        {value}
      </p>
    </div>
  );
}

export default function DraftTrendsContent() {
  const data = computeDraftTrends();

  return (
    <>
      <Container>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickStat label="Seasons" value={String(data.totalSeasons)} />
          <QuickStat label="Total Picks" value={data.totalPicks.toLocaleString()} />
          <QuickStat label="Managers" value={String(data.styles.length)} />
          <QuickStat
            label="Avg Picks/Draft"
            value={
              data.totalSeasons > 0
                ? String(Math.round(data.totalPicks / data.totalSeasons))
                : "0"
            }
          />
        </div>
      </Container>

      <Container className="pt-0">
        <Card className="overflow-hidden">
          <CardHeader
            title="Position Share by Year"
            description="Percentage of draft picks by position each season (skill positions)"
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
                {data.trends.map((t) => (
                  <tr key={t.year} className="border-b border-rule hover:bg-paper transition-colors">
                    <td className="sticky left-0 bg-surface px-3 py-2 text-left font-[family-name:var(--wire-mono)] text-sm font-bold tabular-nums text-ink">
                      {t.year}
                    </td>
                    {SKILL_POSITIONS.map((pos) => {
                      const pct = t.positionShares[pos] || 0;
                      return (
                        <td key={pos} className="px-3 py-2">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-14 h-3 bg-paper overflow-hidden">
                              <div
                                className={`h-full ${POS_FILL[pos]}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
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
        <Card className="overflow-hidden">
          <CardHeader
            title="Average Draft Round by Position"
            description="When each position gets picked on average, season over season"
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
                {data.trends.map((t) => (
                  <tr key={t.year} className="border-b border-rule hover:bg-paper transition-colors">
                    <td className="sticky left-0 bg-surface px-3 py-2 text-left font-[family-name:var(--wire-mono)] text-sm font-bold tabular-nums text-ink">
                      {t.year}
                    </td>
                    {SKILL_POSITIONS.map((pos) => {
                      const avg = t.avgRoundByPosition[pos];
                      if (avg == null) {
                        return (
                          <td key={pos} className="px-3 py-2 text-ink">
                            &middot;
                          </td>
                        );
                      }
                      const roundClass =
                        avg <= 4
                          ? "bg-ink font-bold text-white"
                          : avg <= 8
                            ? "bg-rule text-ink"
                            : "text-ink-muted";
                      return (
                        <td key={pos} className="px-3 py-2">
                          <span className={`inline-block px-2 py-0.5 font-mono text-[11px] ${roundClass}`}>
                            R{avg}
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

      <Container className="pt-0">
        <Card className="overflow-hidden">
          <CardHeader
            title="Manager Draft Style Fingerprints"
            description="Average round of first pick at each skill position, per manager"
          />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.styles.map((s) => (
                <Link
                  key={s.name}
                  href={`/managers/${s.slug}`}
                  className="border border-rule bg-surface p-4 transition-colors hover:border-ink"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center border border-ink bg-paper font-[family-name:var(--wire-display)] text-sm font-extrabold uppercase text-ink">
                      {s.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{s.name}</p>
                      <p className="text-[10px] text-ink-muted">
                        {s.seasonsCount} season{s.seasonsCount !== 1 ? "s" : ""},{" "}
                        {s.totalPicks} picks
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {SKILL_POSITIONS.map((pos) => {
                      const avg = s.avgRounds[pos];
                      if (avg == null) return null;
                      const barWidth = Math.max(5, Math.min(100, ((16 - avg) / 15) * 100));
                      return (
                        <div key={pos} className="flex items-center gap-2">
                          <span className={`w-7 text-right border px-1 py-0 text-[9px] font-bold ${POS_COLORS[pos]}`}>
                            {pos}
                          </span>
                          <div className="flex-1 h-2 bg-paper overflow-hidden">
                            <div
                              className={`h-full ${POS_FILL[pos]}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="w-8 text-right font-mono text-[10px] text-ink-muted">
                            R{avg}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px]">
                    <span className="text-ink-muted">
                      Earliest: <span className="text-ink font-bold">{s.earliestPosition}</span>
                    </span>
                    <span className="text-ink-muted">
                      Latest: <span className="text-ink font-bold">{s.latestPosition}</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      </Container>

      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader
              title="Best Value Picks"
              description="Players drafted significantly earlier than their position average"
            />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {data.bestValues.map((v, i) => (
                  <div
                    key={`${v.year}-${v.pick}-${v.playerName}`}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors"
                  >
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-xs font-bold ${
 i < 3 ? "bg-ink text-white" : "bg-paper text-ink-soft"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-ink">
                        <span className="font-semibold">{v.playerName}</span>
                      </p>
                      <p className="text-xs text-ink-muted">
                        <Link href={`/managers/${getManagerSlug(v.managerName)}`} className="hover:text-result">
                          {v.managerName}
                        </Link>{" "}
                        · R{v.round} Pick {v.pick} · {v.year}
                      </p>
                    </div>
                    <span className={`border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[v.position]}`}>
                      {v.position}
                    </span>
                    <span className="font-[family-name:var(--wire-display)] text-sm font-bold tabular-nums text-ink">
                      +{v.valueDelta}
                    </span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Worst Value Picks"
              description="Players drafted much later than their position average"
            />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {data.worstValues.map((v, i) => (
                  <div
                    key={`${v.year}-${v.pick}-${v.playerName}`}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors"
                  >
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-xs font-bold ${
 i < 3 ? "bg-ink text-white" : "bg-paper text-ink-soft"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-ink">
                        <span className="font-semibold">{v.playerName}</span>
                      </p>
                      <p className="text-xs text-ink-muted">
                        <Link href={`/managers/${getManagerSlug(v.managerName)}`} className="hover:text-result">
                          {v.managerName}
                        </Link>{" "}
                        · R{v.round} Pick {v.pick} · {v.year}
                      </p>
                    </div>
                    <span className={`border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[v.position]}`}>
                      {v.position}
                    </span>
                    <span className="font-[family-name:var(--wire-display)] text-sm font-bold tabular-nums text-ink">
                      {v.valueDelta}
                    </span>
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
            title="Position Preference Breakdown"
            description="Total picks per position for each manager across all drafts"
          />
          <CardBody className="!p-0 overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-rule">
                  <th className="sticky left-0 bg-surface px-3 py-2 text-left font-[family-name:var(--font-heading)] text-[10px] uppercase tracking-[0.15em] text-ink-muted min-w-[100px]">
                    Manager
                  </th>
                  {SKILL_POSITIONS.map((pos) => (
                    <th key={pos} className="px-2 py-2">
                      <span className={`inline-block border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[pos]}`}>
                        {pos}
                      </span>
                    </th>
                  ))}
                  <th className="px-2 py-2 text-[10px] uppercase tracking-[0.15em] text-ink-muted">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.styles.map((s) => {
                  const skillTotal =
                    SKILL_POSITIONS.reduce(
                      (sum, pos) => sum + (s.positionCounts[pos] || 0),
                      0,
                    ) || 1;
                  return (
                    <tr key={s.name} className="border-b border-rule hover:bg-paper transition-colors">
                      <td className="sticky left-0 bg-surface px-3 py-1.5 text-left">
                        <Link
                          href={`/managers/${s.slug}`}
                          className="text-sm font-semibold text-ink hover:text-result transition-colors"
                        >
                          {s.name}
                        </Link>
                      </td>
                      {SKILL_POSITIONS.map((pos) => {
                        const count = s.positionCounts[pos] || 0;
                        const pct = Math.round((count / skillTotal) * 100);
                        return (
                          <td key={pos} className="px-2 py-1.5">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="font-mono text-[11px] text-ink">{count}</span>
                              <span className="font-mono text-[9px] text-ink-muted">{pct}%</span>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-2 py-1.5 font-mono text-[11px] text-ink-muted">
                        {s.totalPicks}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </Container>
    </>
  );
}
