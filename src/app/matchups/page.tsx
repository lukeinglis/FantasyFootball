import type { Metadata } from "next";
import { apiFetch } from "@/lib/fetcher";
import type { Matchup, Scoreboard } from "@/lib/yahoo/types";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import NotConnected, { ApiError } from "@/components/NotConnected";
import { Card, CardBody } from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import WeekSelector from "@/components/WeekSelector";
import { formatPoints, toFiniteNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Matchups",
  description: "Current and past week matchups for Greybushes & Chili Dogs.",
};

export const dynamic = "force-dynamic";

interface SearchParams {
  week?: string | string[];
}

function parseWeek(raw: string | string[] | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return undefined;
  return Math.trunc(num);
}

function statusLabel(status: Matchup["status"]): string {
  switch (status) {
    case "pregame":
      return "Pregame";
    case "inprogress":
      return "Live";
    case "postgame":
      return "Final";
    default:
      return status;
  }
}

function statusBadge(status: Matchup["status"]): string {
  switch (status) {
    case "inprogress":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    case "postgame":
      return "bg-white/10 text-gray-300 border-white/20";
    default:
      return "bg-[#f0c75e]/20 text-[#f0c75e] border-[#f0c75e]/30";
  }
}

export default async function MatchupsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const requestedWeek = parseWeek(params?.week);
  const query =
    requestedWeek !== undefined ? `?week=${requestedWeek}` : "";
  const result = await apiFetch<Scoreboard>(
    `/api/yahoo/scoreboard${query}`
  );

  return (
    <>
      <PageHeader
        eyebrow="Matchups"
        title={
          result.ok ? `Week ${result.data.week}` : "This Week's Matchups"
        }
        subtitle="Live scores, projections, and head-to-head matchups straight from Yahoo."
      >
        {result.ok && (
          <WeekSelector
            current={result.data.week}
            startWeek={1}
            endWeek={Math.max(result.data.week, 18)}
          />
        )}
      </PageHeader>
      <Container>
        {!result.ok ? (
          result.notConfigured ? (
            <NotConnected resource="matchups" />
          ) : (
            <ApiError resource="matchups" detail={result.message} />
          )
        ) : result.data.matchups.length === 0 ? (
          <EmptyState
            icon={<span>🏈</span>}
            title="No matchups this week"
            description="Either the season hasn't started, or this week is a bye for the entire league. Try another week."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {result.data.matchups.map((m) => {
              const [a, b] = m.teams;
              const aPts = toFiniteNumber(a.points, 0);
              const bPts = toFiniteNumber(b.points, 0);
              const isFinal = m.status === "postgame";
              const aWinner = isFinal && aPts > bPts;
              const bWinner = isFinal && bPts > aPts;
              return (
                <Card key={m.matchupId} className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 bg-[#0f1f3a]/60 px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${statusBadge(
                        m.status
                      )}`}
                    >
                      {statusLabel(m.status)}
                    </span>
                    <span className="text-[11px] uppercase tracking-wide text-gray-500">
                      {m.isPlayoffs
                        ? "Playoffs"
                        : m.isConsolation
                        ? "Consolation"
                        : `Week ${m.week}`}
                    </span>
                  </div>
                  <CardBody>
                    <MatchupRow
                      name={a.teamName}
                      manager={a.managerName}
                      points={a.points}
                      projected={a.projectedPoints}
                      winner={aWinner}
                    />
                    <div className="my-2 flex items-center gap-3 text-[11px] uppercase tracking-wider text-gray-500">
                      <span className="flex-1 border-t border-white/10" />
                      vs
                      <span className="flex-1 border-t border-white/10" />
                    </div>
                    <MatchupRow
                      name={b.teamName}
                      manager={b.managerName}
                      points={b.points}
                      projected={b.projectedPoints}
                      winner={bWinner}
                    />
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </Container>
    </>
  );
}

function MatchupRow({
  name,
  manager,
  points,
  projected,
  winner,
}: {
  name: string;
  manager: string;
  points: number;
  projected: number;
  winner: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p
          className={`truncate font-semibold ${
            winner ? "text-[#f0c75e]" : "text-white"
          }`}
        >
          {name}
          {winner && <span className="ml-1 text-xs">🏆</span>}
        </p>
        <p className="truncate text-xs text-gray-400">{manager}</p>
      </div>
      <div className="text-right">
        <p
          className={`font-mono text-2xl font-bold ${
            winner ? "text-[#f0c75e]" : "text-white"
          }`}
        >
          {formatPoints(points, 1)}
        </p>
        <p className="text-[11px] uppercase tracking-wide text-gray-500">
          Proj {formatPoints(projected, 1)}
        </p>
      </div>
    </div>
  );
}
