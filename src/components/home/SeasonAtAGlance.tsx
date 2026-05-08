import { apiFetch } from "@/lib/fetcher";
import type { LeagueStandings, Scoreboard } from "@/lib/yahoo/types";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { formatPoints, toFiniteNumber } from "@/lib/format";

interface Stat {
  label: string;
  value: string;
  hint?: string;
}

export default async function SeasonAtAGlance() {
  const [standings, scoreboard] = await Promise.all([
    apiFetch<LeagueStandings>("/api/yahoo/standings"),
    apiFetch<Scoreboard>("/api/yahoo/scoreboard"),
  ]);

  const stats: Stat[] = [];

  if (scoreboard.ok) {
    stats.push({
      label: "Current Week",
      value: String(toFiniteNumber(scoreboard.data.week, 1)),
    });
  }

  if (standings.ok && standings.data.teams.length > 0) {
    const teams = standings.data.teams;
    const totalGames = teams.reduce(
      (sum, t) =>
        sum +
        toFiniteNumber(t.wins, 0) +
        toFiniteNumber(t.losses, 0) +
        toFiniteNumber(t.ties, 0),
      0
    );
    const totalPoints = teams.reduce(
      (sum, t) => sum + toFiniteNumber(t.pointsFor, 0),
      0
    );
    // Guard against division by zero when no games have been played.
    // Also guard against NaN/Infinity from malformed data.
    const rawAvg = totalGames > 0 ? totalPoints / totalGames : 0;
    const avgPoints = Number.isFinite(rawAvg) ? rawAvg : 0;

    const leader = [...teams].sort(
      (a, b) => toFiniteNumber(b.pointsFor, 0) - toFiniteNumber(a.pointsFor, 0)
    )[0];

    stats.push(
      {
        label: "Season",
        value: standings.data.season || "—",
        hint: "Yahoo league season",
      },
      {
        label: "Avg Points / Game",
        value: formatPoints(avgPoints, 1),
        hint: "Across all teams",
      },
      {
        label: "Top Scorer",
        value: leader?.teamName || "—",
        hint: leader ? `${formatPoints(leader.pointsFor, 1)} PF` : undefined,
      }
    );
  }

  if (stats.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader
        title="Season at a Glance"
        description="The numbers that matter (or don't)."
      />
      <CardBody>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-xs uppercase tracking-wide text-gray-400">
                {s.label}
              </dt>
              <dd className="mt-1 text-xl font-bold text-white">{s.value}</dd>
              {s.hint && (
                <dd className="mt-0.5 text-[11px] text-gray-500">{s.hint}</dd>
              )}
            </div>
          ))}
        </dl>
      </CardBody>
    </Card>
  );
}
