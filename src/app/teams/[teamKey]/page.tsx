import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch } from "@/lib/fetcher";
import type { Roster, Team } from "@/lib/yahoo/types";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import NotConnected, { ApiError } from "@/components/NotConnected";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { formatPoints, formatRecord } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamKey: string }>;
}): Promise<Metadata> {
  const { teamKey } = await params;
  return {
    title: `Team · ${decodeURIComponent(teamKey)}`,
  };
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamKey: string }>;
}) {
  const { teamKey: rawKey } = await params;
  const teamKey = decodeURIComponent(rawKey);

  // Fetch all teams (so we can show the team's record/header) and roster in parallel.
  const [allTeams, roster] = await Promise.all([
    apiFetch<Team[]>("/api/yahoo/teams"),
    apiFetch<Roster>(`/api/yahoo/teams?teamKey=${encodeURIComponent(teamKey)}`),
  ]);

  const team = allTeams.ok
    ? allTeams.data.find((t) => t.teamKey === teamKey)
    : undefined;

  // If neither call worked at all, fall back to an error/not-connected state.
  if (!allTeams.ok && !roster.ok) {
    const notConfigured =
      allTeams.notConfigured || roster.notConfigured;
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
              ← Back to all teams
            </Link>
          </div>
        </Container>
      </>
    );
  }

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
          ← All teams
        </Link>
      </PageHeader>
      <Container>
        <Card>
          <CardHeader
            title={
              roster.ok
                ? `Roster · Week ${roster.data.week}`
                : "Roster"
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
                      <th className="px-3 py-3 text-right">Pts</th>
                      <th className="px-3 py-3 text-right hidden md:table-cell">
                        Proj
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {roster.data.players.map((p) => (
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
                        <td className="px-3 py-2 hidden sm:table-cell text-gray-300">
                          {p.position}
                        </td>
                        <td className="px-3 py-2 hidden sm:table-cell text-gray-400">
                          {p.nflTeam}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[#f0c75e]">
                          {formatPoints(p.points, 1)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-gray-300 hidden md:table-cell">
                          {formatPoints(p.projectedPoints, 1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </Container>
    </>
  );
}
