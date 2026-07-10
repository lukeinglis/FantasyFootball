import type { Metadata } from "next";
import Link from "next/link";
import { computeDraftTrends } from "@/lib/draft-trends";
import { getManagerSlug } from "@/lib/managers";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardBody, CardHeader } from "@/components/Card";

export const metadata: Metadata = {
  title: "Draft Trends",
  description:
    "Cross-season draft position analysis and manager style profiles for Greybushes & Chili Dogs.",
};

const POS_COLORS: Record<string, string> = {
  QB: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  RB: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  WR: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  TE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

const POS_BG_SOLID: Record<string, string> = {
  QB: "bg-rose-500",
  RB: "bg-emerald-500",
  WR: "bg-sky-500",
  TE: "bg-amber-500",
};

const SKILL_POSITIONS = ["QB", "RB", "WR", "TE"];

export default function DraftTrendsPage() {
  const data = computeDraftTrends();

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Draft Trends"
        subtitle={`${data.totalPicks.toLocaleString()} picks across ${data.totalSeasons} seasons of draft data`}
      />

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

      {/* Position Share Over Time */}
      <Container className="pt-0">
        <Card className="overflow-hidden">
          <CardHeader
            title="Position Share by Year"
            description="Percentage of draft picks by position each season (skill positions)"
          />
          <CardBody className="!p-0 overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="sticky left-0 bg-[#2C1810] px-3 py-2 text-left font-[family-name:var(--font-heading)] text-[10px] uppercase tracking-[0.15em] text-gray-400">
                    Year
                  </th>
                  {SKILL_POSITIONS.map((pos) => (
                    <th key={pos} className="px-3 py-2">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[pos]}`}
                      >
                        {pos}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.trends.map((t) => (
                  <tr
                    key={t.year}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="sticky left-0 bg-[#2C1810] px-3 py-2 text-left font-[family-name:var(--font-heading)] font-mono text-sm font-bold text-[#DD550C]">
                      {t.year}
                    </td>
                    {SKILL_POSITIONS.map((pos) => {
                      const pct = t.positionShares[pos] || 0;
                      return (
                        <td key={pos} className="px-3 py-2">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-14 h-3 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${POS_BG_SOLID[pos]}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span
                              className={`font-mono text-[10px] ${
                                pct > 0 ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
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

      {/* Avg Draft Round by Position Over Time */}
      <Container className="pt-0">
        <Card className="overflow-hidden">
          <CardHeader
            title="Average Draft Round by Position"
            description="When each position gets picked on average, season over season"
          />
          <CardBody className="!p-0 overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="sticky left-0 bg-[#2C1810] px-3 py-2 text-left font-[family-name:var(--font-heading)] text-[10px] uppercase tracking-[0.15em] text-gray-400">
                    Year
                  </th>
                  {SKILL_POSITIONS.map((pos) => (
                    <th key={pos} className="px-3 py-2">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[pos]}`}
                      >
                        {pos}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.trends.map((t) => (
                  <tr
                    key={t.year}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="sticky left-0 bg-[#2C1810] px-3 py-2 text-left font-[family-name:var(--font-heading)] font-mono text-sm font-bold text-[#DD550C]">
                      {t.year}
                    </td>
                    {SKILL_POSITIONS.map((pos) => {
                      const avg = t.avgRoundByPosition[pos];
                      if (avg == null) {
                        return (
                          <td key={pos} className="px-3 py-2 text-gray-700">
                            &middot;
                          </td>
                        );
                      }
                      const roundClass =
                        avg <= 4
                          ? "bg-[#DD550C]/20 text-[#DD550C] font-bold"
                          : avg <= 8
                            ? "bg-sky-600/20 text-sky-300"
                            : "text-gray-500";
                      return (
                        <td key={pos} className="px-3 py-2">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 font-mono text-[11px] ${roundClass}`}
                          >
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

      {/* Manager Draft Style Fingerprints */}
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
                  className="rounded-xl border-2 border-[#D4A847]/30 bg-gradient-to-b from-[#2C1810] to-[#1A0F08] p-4 hover:border-[#D4A847]/60 transition-all shadow-md"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#DD550C]/10 border border-[#DD550C]/30 font-[family-name:var(--font-heading)] text-sm font-bold text-[#DD550C]">
                      {s.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {s.name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {s.seasonsCount} season{s.seasonsCount !== 1 ? "s" : ""},{" "}
                        {s.totalPicks} picks
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {SKILL_POSITIONS.map((pos) => {
                      const avg = s.avgRounds[pos];
                      if (avg == null) return null;
                      const barWidth = Math.max(
                        5,
                        Math.min(100, ((16 - avg) / 15) * 100)
                      );
                      return (
                        <div key={pos} className="flex items-center gap-2">
                          <span
                            className={`w-7 text-right rounded-full border px-1 py-0 text-[9px] font-bold ${POS_COLORS[pos]}`}
                          >
                            {pos}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${POS_BG_SOLID[pos]} opacity-70`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="w-8 text-right font-mono text-[10px] text-gray-400">
                            R{avg}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">
                      Earliest:{" "}
                      <span className="text-white font-bold">
                        {s.earliestPosition}
                      </span>
                    </span>
                    <span className="text-gray-400">
                      Latest:{" "}
                      <span className="text-white font-bold">
                        {s.latestPosition}
                      </span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      </Container>

      {/* Best and Worst Value Picks */}
      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader
              title="Best Value Picks"
              description="Players drafted significantly earlier than their position average"
            />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {data.bestValues.map((v, i) => (
                  <div
                    key={`${v.year}-${v.pick}-${v.playerName}`}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 transition-colors"
                  >
                    <span
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${
                        i < 3
                          ? "bg-emerald-600 text-white"
                          : "bg-white/10 text-gray-300"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-white">
                        <span className="font-semibold">{v.playerName}</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        <Link
                          href={`/managers/${getManagerSlug(v.managerName)}`}
                          className="hover:text-[#DD550C]"
                        >
                          {v.managerName}
                        </Link>{" "}
                        · R{v.round} Pick {v.pick} · {v.year}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[v.position]}`}
                    >
                      {v.position}
                    </span>
                    <span className="font-[family-name:var(--font-heading)] text-sm font-bold text-emerald-400">
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
              <div className="divide-y divide-white/5">
                {data.worstValues.map((v, i) => (
                  <div
                    key={`${v.year}-${v.pick}-${v.playerName}`}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 transition-colors"
                  >
                    <span
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${
                        i < 3
                          ? "bg-red-600 text-white"
                          : "bg-white/10 text-gray-300"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-white">
                        <span className="font-semibold">{v.playerName}</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        <Link
                          href={`/managers/${getManagerSlug(v.managerName)}`}
                          className="hover:text-[#DD550C]"
                        >
                          {v.managerName}
                        </Link>{" "}
                        · R{v.round} Pick {v.pick} · {v.year}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[v.position]}`}
                    >
                      {v.position}
                    </span>
                    <span className="font-[family-name:var(--font-heading)] text-sm font-bold text-red-400">
                      {v.valueDelta}
                    </span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* Position Preference Breakdown */}
      <Container className="pt-0">
        <Card className="overflow-hidden">
          <CardHeader
            title="Position Preference Breakdown"
            description="Total picks per position for each manager across all drafts"
          />
          <CardBody className="!p-0 overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="sticky left-0 bg-[#2C1810] px-3 py-2 text-left font-[family-name:var(--font-heading)] text-[10px] uppercase tracking-[0.15em] text-gray-400 min-w-[100px]">
                    Manager
                  </th>
                  {SKILL_POSITIONS.map((pos) => (
                    <th key={pos} className="px-2 py-2">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold ${POS_COLORS[pos]}`}
                      >
                        {pos}
                      </span>
                    </th>
                  ))}
                  <th className="px-2 py-2 text-[10px] uppercase tracking-[0.15em] text-gray-400">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.styles.map((s) => {
                  const skillTotal =
                    SKILL_POSITIONS.reduce(
                      (sum, pos) => sum + (s.positionCounts[pos] || 0),
                      0
                    ) || 1;
                  return (
                    <tr
                      key={s.name}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="sticky left-0 bg-[#2C1810] px-3 py-1.5 text-left">
                        <Link
                          href={`/managers/${s.slug}`}
                          className="text-sm font-semibold text-white hover:text-[#DD550C] transition-colors"
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
                              <span className="font-mono text-[11px] text-white">
                                {count}
                              </span>
                              <span className="font-mono text-[9px] text-gray-500">
                                {pct}%
                              </span>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-2 py-1.5 font-mono text-[11px] text-gray-400">
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

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-3 border-[#D4A847] bg-gradient-to-b from-[#2C1810] to-[#1A0F08] p-4 text-center shadow-lg">
      <p className="font-[family-name:var(--font-heading)] text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(245,240,232,0.5)]">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold text-[#F5F0E8]">
        {value}
      </p>
    </div>
  );
}
