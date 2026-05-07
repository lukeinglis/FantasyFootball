import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch } from "@/lib/fetcher";
import type { Matchup, Roster, Team } from "@/lib/yahoo/types";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import NotConnected, { ApiError } from "@/components/NotConnected";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { formatPoints, formatRecord } from "@/lib/format";

export const dynamic = "force-dynamic";

const POSITION_COLORS: Record<string, string> = {
  QB: "text-rose-300",
  RB: "text-emerald-300",
  WR: "text-sky-300",
  TE: "text-amber-300",
  K: "text-violet-300",
  DEF: "text-slate-300",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamKey: string }>;
}): Promise<Metadata> {
  const { teamKey } = await params;
  const decoded = decodeURIComponent(teamKey);
  const result = await apiFetch<Team[]>("/api/yahoo/teams");
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
    apiFetch<Team[]>("/api/yahoo/teams"),
    apiFetch<Roster>(`/api/yahoo/teams?teamKey=${encodeURIComponent(teamKey)}`),
    apiFetch<Matchup[]>(
      `/api/yahoo/matchups?teamKey=${encodeURIComponent(teamKey)}`
    ),
  ]);

  const team = allTeams.ok
    ? allTeams.data.find((t) => t.teamKey === teamKey)
    : undefined;

  if (!allTeams.ok && !roster.ok) {
    const notConfigured = allTeams.notConfigured || roster.notConfigured;
    return (
      <>
        <PageHeader title="Team" subtitle="Roster and team detail." />
        <Container>
          {notConfigured ? (
            <NotConnected resource="team detail" />
          ) : (
            <ApiError
              resource="team detail"
              detail={allTeams.ok ? roster.message : allTeams.message}
            />
          )}
          <div className="mt-4">
            <Link
              href="/teams"
              className="text-sm text-[#f0c75e] hover:underline"
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
          className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/5"
        >
          All teams
        </Link>
      </PageHeader>
      <Container>
        {/* Stats Overview */}
        {team && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Record" value={formatRecord(team.wins, team.losses, team.ties)} />
            <StatCard label="Points For" value={formatPoints(team.pointsFor, 1)} highlight />
            <StatCard label="Points Against" value={formatPoints(team.pointsAgainst, 1)} />
            {team.waiverPriority > 0 && (
              <StatCard label="Waiver Priority" value={`#${team.waiverPriority}`} />
            )}
          </div>
        )}

        {/* Roster */}
        <Card className="overflow-hidden">
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
              <div className="px-5 py-6 text-sm text-gray-400">
                No players on roster yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0f1f3a] text-xs uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="px-3 py-3">Slot</th>
                      <th className="px-3 py-3">Player</th>
                      <th className="px-3 py-3 hidden sm:table-cell">Pos</th>
                      <th className="px-3 py-3 hidden sm:table-cell">NFL</th>
                      <th className="px-3 py-3 hidden md:table-cell">Bye</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {roster.data.players.map((p) => {
                      const posColor =
                        POSITION_COLORS[p.position.toUpperCase()] ||
                        "text-gray-300";
                      return (
                        <tr
                          key={p.playerKey}
                          className="bg-[#14284a]/40 hover:bg-[#14284a]"
                        >
                          <td className="px-3 py-2 font-mono text-xs text-[#f0c75e]">
                            {p.selectedPosition}
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-medium text-white">
                              {p.playerName}
                            </p>
                            {p.status && (
                              <span className="inline-block mt-0.5 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-300">
                                {p.status}
                              </span>
                            )}
                          </td>
                          <td
                            className={`px-3 py-2 hidden sm:table-cell font-mono text-xs ${posColor}`}
                          >
                            {p.position}
                          </td>
                          <td className="px-3 py-2 hidden sm:table-cell text-gray-400">
                            {p.nflTeam}
                          </td>
                          <td className="px-3 py-2 hidden md:table-cell text-xs text-gray-500">
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

        {/* Matchup History */}
        {matchups.length > 0 && (
          <Card className="mt-6 overflow-hidden">
            <CardHeader
              title="Season Matchups"
              description="Week-by-week results"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0f1f3a] text-xs uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-3 py-2">Week</th>
                    <th className="px-3 py-2">Opponent</th>
                    <th className="px-3 py-2 text-right">Score</th>
                    <th className="px-3 py-2 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
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
                        className="bg-[#14284a]/40 hover:bg-[#14284a]"
                      >
                        <td className="px-3 py-2 font-mono text-[#f0c75e]">
                          {m.week}
                        </td>
                        <td className="px-3 py-2 text-gray-300">
                          {them.teamName}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-white">
                          {formatPoints(us.points, 1)} &ndash;{" "}
                          {formatPoints(them.points, 1)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {m.status === "postgame" ? (
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                                won
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : lost
                                  ? "bg-red-500/20 text-red-300"
                                  : "bg-gray-500/20 text-gray-300"
                              }`}
                            >
                              {won ? "W" : lost ? "L" : "T"}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">
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

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#14284a] p-4 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-xl font-bold ${
          highlight ? "text-[#f0c75e]" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
