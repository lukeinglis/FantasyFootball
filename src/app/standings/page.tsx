import type { Metadata } from "next";
import { apiFetch } from "@/lib/fetcher";
import type { LeagueSettings, LeagueStandings } from "@/lib/yahoo/types";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import NotConnected, { ApiError } from "@/components/NotConnected";
import OffseasonState from "@/components/OffseasonState";
import { Card } from "@/components/Card";
import { formatPercent, formatPoints, formatRecord } from "@/lib/format";

export const metadata: Metadata = {
  title: "Standings",
  description: "Greybushes & Chili Dogs full league standings.",
};

export const dynamic = "force-dynamic";

// Default playoff cutoff when settings are unavailable
const DEFAULT_PLAYOFF_CUTOFF = 6;

export default async function StandingsPage() {
  const [result, settingsResult] = await Promise.all([
    apiFetch<LeagueStandings>("/api/yahoo/standings"),
    apiFetch<LeagueSettings>("/api/yahoo/settings"),
  ]);

  const PLAYOFF_CUTOFF = settingsResult.ok
    ? settingsResult.data.numPlayoffTeams
    : DEFAULT_PLAYOFF_CUTOFF;

  return (
    <>
      <PageHeader
        eyebrow="Live"
        title="Standings"
        subtitle="Top 6 qualify for playoffs. Everyone else gets to think about their life choices."
      />
      <Container>
        {!result.ok ? (
          result.notConfigured ? (
            <NotConnected resource="standings" />
          ) : result.offseason ? (
            <OffseasonState resource="standings" />
          ) : (
            <ApiError resource="standings" detail={result.message} />
          )
        ) : result.data.teams.length === 0 ? (
          <Card>
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No standings yet. The season hasn&apos;t started.
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0f1f3a] text-xs uppercase tracking-wider text-gray-400">
                  <tr>
                    <th scope="col" className="px-3 py-3">
                      Rank
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Team
                    </th>
                    <th scope="col" className="px-3 py-3 hidden sm:table-cell">
                      Manager
                    </th>
                    <th scope="col" className="px-3 py-3 text-right">
                      Record
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right hidden md:table-cell"
                    >
                      Pct
                    </th>
                    <th scope="col" className="px-3 py-3 text-right">
                      PF
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right hidden md:table-cell"
                    >
                      PA
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right hidden lg:table-cell"
                    >
                      Streak
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {result.data.teams.map((team, idx) => {
                    const isCutoff = idx + 1 === PLAYOFF_CUTOFF;
                    const inPlayoffs = team.rank <= PLAYOFF_CUTOFF;
                    return (
                      <tr
                        key={team.teamKey}
                        className={`${
                          inPlayoffs ? "bg-[#14284a]" : "bg-[#14284a]/40"
                        } ${
                          isCutoff
                            ? "border-b-2 border-[#f0c75e]/60"
                            : ""
                        } hover:bg-[#1a3155] transition-colors`}
                      >
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              inPlayoffs
                                ? "bg-[#f0c75e] text-[#0f1f3a]"
                                : "bg-white/10 text-gray-300"
                            }`}
                          >
                            {team.rank}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium text-white">
                            {team.teamName}
                          </p>
                          <p className="text-xs text-gray-400 sm:hidden">
                            {team.managerName}
                          </p>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell text-gray-300">
                          {team.managerName}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-gray-200">
                          {formatRecord(team.wins, team.losses, team.ties)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-gray-300 hidden md:table-cell">
                          {formatPercent(team.percentage)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[#f0c75e]">
                          {formatPoints(team.pointsFor, 1)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-gray-300 hidden md:table-cell">
                          {formatPoints(team.pointsAgainst, 1)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-gray-300 hidden lg:table-cell">
                          {team.streak || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-white/10 bg-[#0f1f3a]/60 px-4 py-2 text-[11px] text-gray-400">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#f0c75e]" />
              Playoff bracket cut-off after rank {PLAYOFF_CUTOFF}.
            </div>
          </Card>
        )}
      </Container>
    </>
  );
}
