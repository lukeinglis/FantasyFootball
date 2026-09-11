import Link from "next/link";
import { fetchStandings } from "@/lib/server-data";
import { Card, CardBody, CardHeader } from "@/components/Card";
import DataState from "@/components/DataState";
import { formatPoints, formatRecord } from "@/lib/format";

export default async function StandingsPreview() {
  const result = await fetchStandings();

  // The old copy read "Live from Yahoo, refreshed every 15 minutes" no matter
  // what came back, including when nothing did. Say which of the two we are
  // actually showing.
  const description = result.ok
    ? "Live from Yahoo."
    : "Live standings are unavailable right now.";

  return (
    <Card>
      <CardHeader
        title="Top of the Standings"
        description={description}
        action={
          <Link
            href="/standings"
            className="text-xs font-medium text-result hover:underline"
          >
            View all →
          </Link>
        }
      />
      <CardBody>
        {!result.ok ? (
          <DataState result={result} resource="standings" />
        ) : (
          <ol className="space-y-2">
            {result.data.teams.slice(0, 5).map((team) => (
              <li
                key={team.teamKey}
                className="flex items-center justify-between gap-3 bg-surface px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center bg-result text-xs font-bold text-white">
                    {team.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {team.teamName}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {team.managerName}
                    </p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-4 text-xs">
                  <span className="font-mono text-ink-soft">
                    {formatRecord(team.wins, team.losses, team.ties)}
                  </span>
                  <span className="font-mono text-result">
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
