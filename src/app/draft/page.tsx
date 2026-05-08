import type { Metadata } from "next";
import { apiFetch } from "@/lib/fetcher";
import type { DraftResult, Team } from "@/lib/yahoo/types";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import NotConnected, { ApiError } from "@/components/NotConnected";
import OffseasonState from "@/components/OffseasonState";
import { Card } from "@/components/Card";
import EmptyState from "@/components/EmptyState";

export const metadata: Metadata = {
  title: "Draft",
  description: "The Greybushes & Chili Dogs draft board.",
};

export const dynamic = "force-dynamic";

const POSITION_COLORS: Record<string, string> = {
  QB: "bg-rose-500/20 text-rose-200 border-rose-500/30",
  RB: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
  WR: "bg-sky-500/20 text-sky-200 border-sky-200/30",
  TE: "bg-amber-500/20 text-amber-200 border-amber-500/30",
  K: "bg-violet-500/20 text-violet-200 border-violet-500/30",
  DEF: "bg-slate-500/20 text-slate-200 border-slate-500/30",
};

function positionBadge(position: string): string {
  const trimmed = position.trim().toUpperCase();
  return (
    POSITION_COLORS[trimmed] ||
    "bg-white/10 text-gray-200 border-white/20"
  );
}

interface DraftBoardCell {
  pick: DraftResult | undefined;
}

interface DraftBoardRow {
  round: number;
  cells: DraftBoardCell[];
}

function buildBoard(
  picks: DraftResult[],
  teams: Team[]
): { rows: DraftBoardRow[]; teamOrder: Team[] } {
  if (picks.length === 0) return { rows: [], teamOrder: [] };

  // Determine round 1 team order from the picks themselves (snake or linear).
  const round1 = picks
    .filter((p) => p.round === 1)
    .sort((a, b) => a.pick - b.pick);

  // Build the team order from round 1 picks; fall back to teams list.
  const seen = new Set<string>();
  const teamOrder: Team[] = [];
  for (const p of round1) {
    if (!seen.has(p.teamKey)) {
      seen.add(p.teamKey);
      const t =
        teams.find((tt) => tt.teamKey === p.teamKey) ||
        // synthesize a minimal team if not in /teams response
        ({
          teamKey: p.teamKey,
          teamId: 0,
          teamName: p.teamName,
          managerName: p.managerName,
          managerId: "",
          logoUrl: null,
          waiverPriority: 0,
          faabBalance: null,
          wins: 0,
          losses: 0,
          ties: 0,
          pointsFor: 0,
          pointsAgainst: 0,
        } satisfies Team);
      teamOrder.push(t);
    }
  }
  if (teamOrder.length === 0) teamOrder.push(...teams);

  const teamCount = teamOrder.length || 12;
  const totalRounds = Math.max(...picks.map((p) => p.round), 1);

  // Index picks by (round, teamKey) to handle both snake and linear drafts.
  const pickByCell = new Map<string, DraftResult>();
  for (const p of picks) {
    pickByCell.set(`${p.round}:${p.teamKey}`, p);
  }

  const rows: DraftBoardRow[] = [];
  for (let r = 1; r <= totalRounds; r++) {
    const cells: DraftBoardCell[] = teamOrder.map((t) => ({
      pick: pickByCell.get(`${r}:${t.teamKey}`),
    }));
    rows.push({ round: r, cells });
  }

  // Pad to teamCount in case of synthesized teams
  for (const row of rows) {
    while (row.cells.length < teamCount) row.cells.push({ pick: undefined });
  }

  return { rows, teamOrder };
}

export default async function DraftPage() {
  const [draftRes, teamsRes] = await Promise.all([
    apiFetch<DraftResult[]>("/api/yahoo/draft"),
    apiFetch<Team[]>("/api/yahoo/teams"),
  ]);

  if (!draftRes.ok) {
    return (
      <>
        <PageHeader
          eyebrow="Draft"
          title="Draft Board"
          subtitle="Every pick, every regret."
        />
        <Container>
          {draftRes.notConfigured ? (
            <NotConnected resource="draft results" />
          ) : draftRes.offseason ? (
            <OffseasonState resource="draft results" />
          ) : (
            <ApiError resource="draft results" detail={draftRes.message} />
          )}
        </Container>
      </>
    );
  }

  const picks = draftRes.data;
  const teams = teamsRes.ok ? teamsRes.data : [];

  if (picks.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Draft"
          title="Draft Board"
          subtitle="Every pick, every regret."
        />
        <Container>
          <EmptyState
            icon={<span>📋</span>}
            title="Draft hasn't happened yet"
            description="Once the draft is complete, every pick will appear here in glorious detail."
          />
        </Container>
      </>
    );
  }

  const { rows, teamOrder } = buildBoard(picks, teams);

  return (
    <>
      <PageHeader
        eyebrow="Draft"
        title="Draft Board"
        subtitle={`${picks.length} picks across ${rows.length} rounds. Squint and you can see who tanked.`}
      />
      <Container>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0C2340] text-[10px] uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="sticky left-0 z-10 bg-[#0C2340] px-2 py-2">
                    Rd
                  </th>
                  {teamOrder.map((t) => (
                    <th
                      key={t.teamKey}
                      className="px-2 py-2 min-w-[120px] text-left"
                    >
                      <p className="truncate font-semibold text-white">
                        {t.teamName}
                      </p>
                      <p className="truncate text-[10px] font-normal text-gray-500">
                        {t.managerName}
                      </p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row) => (
                  <tr key={row.round} className="bg-[#112d4e]/40">
                    <td className="sticky left-0 z-10 bg-[#0C2340] px-2 py-2 font-mono text-[#DD550C]">
                      R{row.round}
                    </td>
                    {row.cells.map((cell, idx) => {
                      const p = cell.pick;
                      return (
                        <td
                          key={`${row.round}-${idx}`}
                          className="px-2 py-2 align-top"
                        >
                          {p ? (
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[10px] text-gray-500">
                                  #{p.pick}
                                </span>
                                <span
                                  className={`rounded-full border px-1.5 py-0 text-[9px] font-bold ${positionBadge(
                                    p.position
                                  )}`}
                                >
                                  {p.position}
                                </span>
                              </div>
                              <p className="mt-1 font-medium text-white leading-tight">
                                {p.playerName}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {p.nflTeam}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Container>
    </>
  );
}
