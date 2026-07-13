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
              className="text-sm text-[#DD550C] hover:underline"
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
          className="rounded-md border border-[#D4A847]/30 px-3 py-1.5 text-xs text-[#F5F0E8]/70 hover:bg-white/5"
        >
          All teams
        </Link>
      </PageHeader>
      <Container>
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
              <div className="px-5 py-6 text-sm text-[#F5F0E8]/50">
                No players on roster yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-[#D4A847]/30">
                      <th className="px-3 py-3 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">Slot</th>
                      <th className="px-3 py-3 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">Player</th>
                      <th className="px-3 py-3 hidden sm:table-cell font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">Pos</th>
                      <th className="px-3 py-3 hidden sm:table-cell font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">NFL</th>
                      <th className="px-3 py-3 hidden md:table-cell font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">Bye</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {roster.data.players.map((p) => {
                      const posColor =
                        POSITION_COLORS[p.position.toUpperCase()] ||
                        "text-[#F5F0E8]/60";
                      return (
                        <tr
                          key={p.playerKey}
                          className="hover:bg-[rgba(212,168,71,0.08)] transition-colors"
                        >
                          <td className="px-3 py-2 font-[family-name:var(--font-heading)] text-xs text-[#DD550C]">
                            {p.selectedPosition}
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-medium text-[#F5F0E8]">
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
                          <td className="px-3 py-2 hidden sm:table-cell text-[#F5F0E8]/50">
                            {p.nflTeam}
                          </td>
                          <td className="px-3 py-2 hidden md:table-cell text-xs text-[#F5F0E8]/40">
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
                  <tr className="border-b-2 border-[#D4A847]/30">
                    <th className="px-3 py-2 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">Week</th>
                    <th className="px-3 py-2 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">Opponent</th>
                    <th className="px-3 py-2 text-right font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">Score</th>
                    <th className="px-3 py-2 text-right font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">Result</th>
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
                        className="hover:bg-[rgba(212,168,71,0.08)] transition-colors"
                      >
                        <td className="px-3 py-2 font-[family-name:var(--font-heading)] text-[#DD550C]">
                          {m.week}
                        </td>
                        <td className="px-3 py-2 text-[#F5F0E8]/70">
                          {them.teamName}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[#F5F0E8]">
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
                                  : "bg-gray-500/20 text-[#F5F0E8]/60"
                              }`}
                            >
                              {won ? "W" : lost ? "L" : "T"}
                            </span>
                          ) : (
                            <span className="text-xs text-[#F5F0E8]/40">
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
    <Card variant="scoreboard">
      <CardBody>
        <div className="text-center">
          <p className="font-[family-name:var(--font-heading)] text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5F0E8]/50">
            {label}
          </p>
          <p
            className={`mt-1 font-[family-name:var(--font-heading)] text-xl font-bold ${
              highlight ? "text-[#FFD23F] text-shadow-glow-yellow" : "text-[#F5F0E8]"
            }`}
          >
            {value}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
