import type { Metadata } from "next";
import Link from "next/link";
import { fetchTeams, fetchRoster, fetchTeamMatchups } from "@/lib/server-data";
import type { Matchup, Roster, Team } from "@/lib/yahoo/types";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import NotConnected, { ApiError } from "@/components/NotConnected";
import OffseasonState from "@/components/OffseasonState";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { formatPoints, formatRecord } from "@/lib/format";
import { POS_TEXT } from "@/lib/records";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamKey: string }>;
}): Promise<Metadata> {
  const { teamKey } = await params;
  const decoded = decodeURIComponent(teamKey);
  const result = await fetchTeams();
  const team = result.ok
    ? result.data.find((t) => t.teamKey === decoded)
    : null;
  return {
    title: team ? team.teamName : "Team Detail",
    description: team
      ? `${team.teamName} managed by ${team.managerName}`
      : "Team details for Greybushes & Chili Dogs.",
  };
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamKey: string }>;
}) {
  const { teamKey: rawKey } = await params;
  const teamKey = decodeURIComponent(rawKey);

  const [allTeams, roster, matchupsRes] = await Promise.all([
    fetchTeams(),
    fetchRoster(teamKey),
    fetchTeamMatchups(teamKey),
  ]);

  const team = allTeams.ok
    ? allTeams.data.find((t) => t.teamKey === teamKey)
    : undefined;

  if (!allTeams.ok && !roster.ok) {
    const notConfigured = allTeams.notConfigured || roster.notConfigured;
    const offseason = (!allTeams.ok && allTeams.offseason) || (!roster.ok && roster.offseason);
    return (
      <>
        <PageHeader title="Team" subtitle="Roster and team detail." />
        <Container>
          {notConfigured ? (
            <NotConnected resource="team detail" />
          ) : offseason ? (
            <OffseasonState resource="team detail" />
          ) : (
            <ApiError
              resource="team detail"
              detail={allTeams.ok ? roster.message : allTeams.message}
            />
          )}
          <div className="mt-4">
            <Link
              href="/teams"
              className="text-sm text-result hover:underline"
            >
              Back to all teams
            </Link>
          </div>
        </Container>
      </>
    );
  }

  const matchups = matchupsRes.ok ? matchupsRes.data : [];

  return (
    <>
      <PageHeader
        eyebrow="Franchise"
        title={team?.teamName ?? (roster.ok ? roster.data.teamName : "Team")}
        subtitle={
          team
            ? `${team.managerName} · ${formatRecord(team.wins, team.losses, team.ties)} · ${formatPoints(team.pointsFor, 1)} PF`
            : "Active roster snapshot."
        }
      >
        <Link
          href="/teams"
          className="border border-record/30 px-3 py-1.5 text-xs text-ink-soft hover:bg-paper"
        >
          All teams
        </Link>
      </PageHeader>
      <Container>
        {team && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Record" value={formatRecord(team.wins, team.losses, team.ties)} />
            <StatCard label="Points For" value={formatPoints(team.pointsFor, 1)} />
            <StatCard label="Points Against" value={formatPoints(team.pointsAgainst, 1)} />
            {team.waiverPriority > 0 && (
              <StatCard label="Waiver Priority" value={`#${team.waiverPriority}`} />
            )}
          </div>
        )}

        <Card variant="scoreboard" className="overflow-hidden">
          <CardHeader
            title={
              roster.ok ? `Roster · Week ${roster.data.week}` : "Roster"
            }
            description="Position, NFL team, and current week status."
          />
          <CardBody className="!p-0">
            {!roster.ok ? (
              <div className="px-5 py-6">
                {roster.notConfigured ? (
                  <NotConnected resource="roster" />
                ) : (
                  <ApiError resource="roster" detail={roster.message} />
                )}
              </div>
            ) : roster.data.players.length === 0 ? (
              <div className="px-5 py-6 text-sm text-ink-muted">
                No players on roster yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-record/30">
                      <th className="px-3 py-3 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-record">Slot</th>
                      <th className="px-3 py-3 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-record">Player</th>
                      <th className="px-3 py-3 hidden sm:table-cell font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-record">Pos</th>
                      <th className="px-3 py-3 hidden sm:table-cell font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-record">NFL</th>
                      <th className="px-3 py-3 hidden md:table-cell font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-record">Bye</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {roster.data.players.map((p) => {
                      const posColor =
                        POS_TEXT[p.position.toUpperCase()] ||
                        "text-ink-muted";
                      return (
                        <tr
                          key={p.playerKey}
                          className="hover:bg-paper transition-colors"
                        >
                          <td className="px-3 py-2 font-[family-name:var(--font-heading)] text-xs text-result">
                            {p.selectedPosition}
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-medium text-ink">
                              {p.playerName}
                            </p>
                            {p.status && (
                              <span className="inline-block mt-0.5 bg-result/10 px-2 py-0.5 text-[10px] font-medium text-result">
                                {p.status}
                              </span>
                            )}
                          </td>
                          <td
                            className={`px-3 py-2 hidden sm:table-cell font-mono text-xs ${posColor}`}
                          >
                            {p.position}
                          </td>
                          <td className="px-3 py-2 hidden sm:table-cell text-ink-muted">
                            {p.nflTeam}
                          </td>
                          <td className="px-3 py-2 hidden md:table-cell text-xs text-ink-faint">
                            {p.byeWeek || ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {matchups.length > 0 && (
          <Card variant="scoreboard" className="mt-6 overflow-hidden">
            <CardHeader
              title="Season Matchups"
              description="Week-by-week results"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-record/30">
                    <th className="px-3 py-2 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-record">Week</th>
                    <th className="px-3 py-2 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-record">Opponent</th>
                    <th className="px-3 py-2 text-right font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-record">Score</th>
                    <th className="px-3 py-2 text-right font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-record">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {matchups.map((m) => {
                    const isTeamA = m.teams[0].teamKey === teamKey;
                    const us = isTeamA ? m.teams[0] : m.teams[1];
                    const them = isTeamA ? m.teams[1] : m.teams[0];
                    const won =
                      m.status === "postgame" && us.points > them.points;
                    const lost =
                      m.status === "postgame" && us.points < them.points;
                    return (
                      <tr
                        key={m.matchupId}
                        className="hover:bg-paper transition-colors"
                      >
                        <td className="px-3 py-2 font-[family-name:var(--font-heading)] text-result">
                          {m.week}
                        </td>
                        <td className="px-3 py-2 text-ink-soft">
                          {them.teamName}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-ink">
                          {formatPoints(us.points, 1)} &ndash;{" "}
                          {formatPoints(them.points, 1)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {m.status === "postgame" ? (
                            <span
                              className={`inline-flex px-2 py-0.5 text-xs font-bold ${
 won
                                  ? "bg-money/10 text-money"
                                  : lost
                                  ? "bg-result/10 text-result"
                                  : "bg-paper text-ink-muted"
                              }`}
                            >
                              {won ? "W" : lost ? "L" : "T"}
                            </span>
                          ) : (
                            <span className="text-xs text-ink-faint">
                              {m.status === "inprogress" ? "Live" : "Upcoming"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </Container>
    </>
  );
}

// Points For sat in gold beside Points Against in ink, which implied the two
// were different kinds of number. They are the same number measured twice.
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="scoreboard">
      <CardBody>
        <div className="text-center">
          <p className="font-[family-name:var(--wire-mono)] text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
            {label}
          </p>
          <p className="mt-1 font-[family-name:var(--wire-display)] text-xl font-extrabold tabular-nums text-ink">
            {value}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
