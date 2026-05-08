import Link from "next/link";
import { apiFetch } from "@/lib/fetcher";
import type { Scoreboard } from "@/lib/yahoo/types";
import { Card, CardBody, CardHeader } from "@/components/Card";
import NotConnected, { ApiError } from "@/components/NotConnected";
import OffseasonState from "@/components/OffseasonState";
import { formatPoints } from "@/lib/format";

export default async function ScoreboardPreview() {
  const result = await apiFetch<Scoreboard>("/api/yahoo/scoreboard");

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
            className="text-xs font-medium text-[#DD550C] hover:underline"
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
          <p className="text-sm text-gray-400">
            No matchups posted yet. Check back closer to kickoff.
          </p>
        ) : (
          <ul className="space-y-2">
            {result.data.matchups.slice(0, 4).map((m) => {
              const [a, b] = m.teams;
              return (
                <li
                  key={m.matchupId}
                  className="rounded-lg bg-[#0C2340]/60 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-white">
                      {a.teamName}
                    </span>
                    <span className="font-mono text-[#DD550C]">
                      {formatPoints(a.points, 1)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-white">
                      {b.teamName}
                    </span>
                    <span className="font-mono text-[#DD550C]">
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
