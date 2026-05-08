import Link from "next/link";
import { apiFetch } from "@/lib/fetcher";
import type { LeagueStandings } from "@/lib/yahoo/types";
import { Card, CardBody, CardHeader } from "@/components/Card";
import NotConnected, { ApiError } from "@/components/NotConnected";
import OffseasonState from "@/components/OffseasonState";
import { formatPoints, formatRecord } from "@/lib/format";

export default async function StandingsPreview() {
  const result = await apiFetch<LeagueStandings>("/api/yahoo/standings");

  return (
    <Card>
      <CardHeader
        title="Top of the Standings"
        description="Live from Yahoo, refreshed every 15 minutes."
        action={
          <Link
            href="/standings"
            className="text-xs font-medium text-[#f0c75e] hover:underline"
          >
            View all →
          </Link>
        }
      />
      <CardBody>
        {!result.ok ? (
          result.notConfigured ? (
            <NotConnected resource="standings" />
          ) : result.offseason ? (
            <OffseasonState resource="standings" />
          ) : (
            <ApiError resource="standings" detail={result.message} />
          )
        ) : (
          <ol className="space-y-2">
            {result.data.teams.slice(0, 5).map((team) => (
              <li
                key={team.teamKey}
                className="flex items-center justify-between gap-3 rounded-lg bg-[#0f1f3a]/60 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#f0c75e] text-xs font-bold text-[#0f1f3a]">
                    {team.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {team.teamName}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {team.managerName}
                    </p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-4 text-xs">
                  <span className="font-mono text-gray-300">
                    {formatRecord(team.wins, team.losses, team.ties)}
                  </span>
                  <span className="font-mono text-[#f0c75e]">
                    {formatPoints(team.pointsFor, 1)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}
