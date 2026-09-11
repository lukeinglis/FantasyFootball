import Link from "next/link";
import { fetchScoreboard } from "@/lib/server-data";
import { Card, CardBody, CardHeader } from "@/components/Card";
import NotConnected, { ApiError } from "@/components/NotConnected";
import OffseasonState from "@/components/OffseasonState";
import { formatPoints } from "@/lib/format";

export default async function ScoreboardPreview() {
  const result = await fetchScoreboard();

  return (
    <Card>
      <CardHeader
        title={
          result.ok ? `Week ${result.data.week} Matchups` : "This Week's Slate"
        }
        description="Currently live and projected scores."
        action={
          <Link
            href="/matchups"
            className="text-xs font-medium text-result hover:underline"
          >
            View all →
          </Link>
        }
      />
      <CardBody>
        {!result.ok ? (
          result.notConfigured ? (
            <NotConnected resource="matchups" />
          ) : result.offseason ? (
            <OffseasonState resource="matchups" />
          ) : (
            <ApiError resource="matchups" detail={result.message} />
          )
        ) : result.data.matchups.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No matchups posted yet. Check back closer to kickoff.
          </p>
        ) : (
          <ul className="space-y-2">
            {result.data.matchups.slice(0, 4).map((m) => {
              const [a, b] = m.teams;
              return (
                <li
                  key={m.matchupId}
                  className="bg-surface px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-ink">
                      {a.teamName}
                    </span>
                    <span className="font-mono text-result">
                      {formatPoints(a.points, 1)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-ink">
                      {b.teamName}
                    </span>
                    <span className="font-mono text-result">
                      {formatPoints(b.points, 1)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
