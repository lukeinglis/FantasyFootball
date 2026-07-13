import type { Metadata } from "next";
import { fetchStandings, fetchSettings } from "@/lib/server-data";

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
    fetchStandings(),
    fetchSettings(),
  ]);

  const PLAYOFF_CUTOFF = settingsResult.ok
    ? settingsResult.data.numPlayoffTeams
    : DEFAULT_PLAYOFF_CUTOFF;

  return (
    <>
      <PageHeader
        eyebrow="Live"
        pennant="2025 Season"
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
            <div className="px-5 py-8 text-center text-sm text-[#F5F0E8]/50">
              No standings yet. The season hasn&apos;t started.
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden" variant="scoreboard">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-[#D4A847]/30">
                    <th scope="col" className="px-3 py-3 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">
                      Rank
                    </th>
                    <th scope="col" className="px-3 py-3 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">
                      Team
                    </th>
                    <th scope="col" className="px-3 py-3 hidden sm:table-cell font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">
                      Manager
                    </th>
                    <th scope="col" className="px-3 py-3 text-right font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">
                      Record
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right hidden md:table-cell font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]"
                    >
                      Pct
                    </th>
                    <th scope="col" className="px-3 py-3 text-right font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">
                      PF
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right hidden md:table-cell font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]"
                    >
                      PA
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right hidden lg:table-cell font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]"
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
                          inPlayoffs ? "bg-white/[0.03]" : ""
                        } ${
                          isCutoff
                            ? "border-b-2 border-[#DD550C]/60"
                            : ""
                        } hover:bg-[rgba(212,168,71,0.08)] transition-colors`}
                      >
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${
                              inPlayoffs
                                ? "bg-[#DD550C] text-white"
                                : "bg-white/10 text-[#F5F0E8]/60"
                            }`}
                          >
                            {team.rank}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-semibold text-[#F5F0E8]">
                            {team.teamName}
                          </p>
                          <p className="text-xs text-[#F5F0E8]/50 sm:hidden">
                            {team.managerName}
                          </p>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell text-[#F5F0E8]/70">
                          {team.managerName}
                        </td>
                        <td className="px-3 py-3 text-right font-[family-name:var(--font-heading)] text-base text-[#4CAF50] tracking-wide">
                          {formatRecord(team.wins, team.losses, team.ties)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[#F5F0E8]/60 hidden md:table-cell">
                          {formatPercent(team.percentage)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[#DD550C]">
                          {formatPoints(team.pointsFor, 1)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[#F5F0E8]/60 hidden md:table-cell">
                          {formatPoints(team.pointsAgainst, 1)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[#F5F0E8]/60 hidden lg:table-cell">
                          {team.streak || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#D4A847]/20 px-4 py-2 text-[11px] text-[#F5F0E8]/50">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#DD550C]" />
              Playoff bracket cut-off after rank {PLAYOFF_CUTOFF}.
            </div>
          </Card>
        )}
      </Container>
    </>
  );
}
