import { fetchDraft, fetchTeams } from "@/lib/server-data";
import type { DraftResult, Team } from "@/lib/yahoo/types";
import Container from "@/components/Container";
import DataState from "@/components/DataState";
import { Card } from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import { POS_COLORS } from "@/lib/records";

function positionBadge(position: string): string {
  const trimmed = position.trim().toUpperCase();
  return (
    POS_COLORS[trimmed] ||
    "bg-paper text-ink-soft border-rule"
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
  teams: Team[],
): { rows: DraftBoardRow[]; teamOrder: Team[] } {
  if (picks.length === 0) return { rows: [], teamOrder: [] };

  const round1 = picks
    .filter((p) => p.round === 1)
    .sort((a, b) => a.pick - b.pick);

  const seen = new Set<string>();
  const teamOrder: Team[] = [];
  for (const p of round1) {
    if (!seen.has(p.teamKey)) {
      seen.add(p.teamKey);
      const t =
        teams.find((tt) => tt.teamKey === p.teamKey) ||
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

  for (const row of rows) {
    while (row.cells.length < teamCount) row.cells.push({ pick: undefined });
  }

  return { rows, teamOrder };
}

export default async function DraftBoardContent() {
  const [draftRes, teamsRes] = await Promise.all([
    fetchDraft(),
    fetchTeams(),
  ]);

  if (!draftRes.ok) {
    return (
      <Container>
        <DataState result={draftRes} resource="draft results" />
      </Container>
    );
  }

  const picks = draftRes.data;
  const teams = teamsRes.ok ? teamsRes.data : [];

  if (picks.length === 0) {
    return (
      <Container>
        <EmptyState
          title="Draft hasn't happened yet"
          description="Once the draft is complete, every pick will appear here in glorious detail."
        />
      </Container>
    );
  }

  const { rows, teamOrder } = buildBoard(picks, teams);

  return (
    <Container>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-[10px] uppercase tracking-wider text-record font-[family-name:var(--font-heading)]">
              <tr>
                <th className="sticky left-0 z-10 bg-surface px-2 py-2">
                  Rd
                </th>
                {teamOrder.map((t) => (
                  <th
                    key={t.teamKey}
                    className="px-2 py-2 min-w-[120px] text-left"
                  >
                    <p className="truncate font-semibold text-ink">
                      {t.teamName}
                    </p>
                    <p className="truncate text-[10px] font-normal text-ink-muted">
                      {t.managerName}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {rows.map((row) => (
                <tr key={row.round} className="bg-surface">
                  <td className="sticky left-0 z-10 bg-surface px-2 py-2 font-mono text-result">
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
                              <span className="font-mono text-[10px] text-ink-muted">
                                #{p.pick}
                              </span>
                              <span
                                className={`border px-1.5 py-0 text-[9px] font-bold ${positionBadge(
 p.position,
                                )}`}
                              >
                                {p.position}
                              </span>
                            </div>
                            <p className="mt-1 font-medium text-ink leading-tight">
                              {p.playerName}
                            </p>
                            <p className="text-[10px] text-ink-muted">
                              {p.nflTeam}
                            </p>
                          </div>
                        ) : (
                          <span className="text-ink-muted">&mdash;</span>
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
  );
}
