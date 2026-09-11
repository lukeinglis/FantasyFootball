import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import Container from "@/components/Container";
import { Card, CardBody, CardHeader } from "@/components/Card";
import DraftHistoryClient from "@/components/DraftHistoryClient";
import { POS_COLORS } from "@/lib/records";

interface DraftPick {
  pick: number;
  round: number;
  teamKey: string;
  teamName: string;
  managerName: string;
  playerKey: string;
  playerName: string;
  position: string;
  nflTeam: string;
  isKeeper?: boolean;
  keeperCost?: number | null;
}

interface SeasonDraft {
  year: number;
  picks: DraftPick[];
  teams: { teamKey: string; teamName: string; managerName: string }[];
}

function loadDrafts(): SeasonDraft[] {
  const dir = join(process.cwd(), "src", "data", "drafts");
  try {
    const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort().reverse();
    return files.map((f) => {
      const raw = readFileSync(join(dir, f), "utf-8");
      return JSON.parse(raw) as SeasonDraft;
    });
  } catch {
    return [];
  }
}

function computeStats(drafts: SeasonDraft[]) {
  const allPicks = drafts.flatMap((d) => d.picks);
  const totalPicks = allPicks.length;
  const totalDrafts = drafts.length;

  const posCounts: Record<string, number> = {};
  for (const p of allPicks) {
    const pos = p.position || "Unknown";
    posCounts[pos] = (posCounts[pos] || 0) + 1;
  }

  const r1Pos: Record<string, number> = {};
  for (const p of allPicks.filter((p) => p.round === 1)) {
    const pos = p.position || "Unknown";
    r1Pos[pos] = (r1Pos[pos] || 0) + 1;
  }

  const playerCounts: Record<string, { count: number; position: string; nflTeam: string; years: number[] }> = {};
  for (const d of drafts) {
    for (const p of d.picks) {
      if (!p.playerName) continue;
      if (!playerCounts[p.playerName]) {
        playerCounts[p.playerName] = { count: 0, position: p.position, nflTeam: p.nflTeam, years: [] };
      }
      playerCounts[p.playerName].count++;
      playerCounts[p.playerName].years.push(d.year);
    }
  }
  const mostDrafted = Object.entries(playerCounts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const firstOveralls = drafts.map((d) => {
    const first = d.picks.find((p) => p.pick === 1);
    return {
      year: d.year,
      player: first?.playerName || "Unknown",
      position: first?.position || "",
      nflTeam: first?.nflTeam || "",
      manager: first?.managerName || first?.teamName || "",
    };
  });

  const totalKeepers = allPicks.filter((p) => p.isKeeper).length;

  return { totalPicks, totalDrafts, totalKeepers, posCounts, r1Pos, mostDrafted, firstOveralls };
}

export default function DraftHistoryContent() {
  const drafts = loadDrafts();
  const stats = computeStats(drafts);
  const years = drafts.map((d) => d.year);

  return (
    <>
      <Container>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <Card variant="scoreboard">
            <CardBody>
              <div className="text-center">
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Total Picks</p>
                <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-record">{stats.totalPicks.toLocaleString()}</p>
              </div>
            </CardBody>
          </Card>
          <Card variant="scoreboard">
            <CardBody>
              <div className="text-center">
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Drafts</p>
                <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-record">{stats.totalDrafts}</p>
              </div>
            </CardBody>
          </Card>
          <Card variant="scoreboard">
            <CardBody>
              <div className="text-center">
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-record">Keepers</p>
                <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-record">{stats.totalKeepers}</p>
              </div>
            </CardBody>
          </Card>
          <Card variant="scoreboard">
            <CardBody>
              <div className="text-center">
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Rounds / Draft</p>
                <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-record">16</p>
              </div>
            </CardBody>
          </Card>
          <Card variant="scoreboard">
            <CardBody>
              <div className="text-center">
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Teams / Draft</p>
                <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-record">12</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      <Container className="pt-0">
        <Card className="overflow-hidden">
          <CardHeader title="First Overall Picks" description="The #1 pick from every draft" />
          <CardBody className="!p-0">
            <div className="divide-y divide-rule">
              {stats.firstOveralls.map((fo) => (
                <div key={fo.year} className="flex items-center gap-4 px-5 py-3 hover:bg-paper transition-colors">
                  <span className="font-[family-name:var(--font-heading)] font-mono text-lg font-bold text-result">{fo.year}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{fo.player}</p>
                    <p className="text-xs text-ink-muted">{fo.position} · {fo.nflTeam}</p>
                  </div>
                  <span className="text-sm text-ink-muted">by {fo.manager}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </Container>

      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="Most Drafted Players" description="Players drafted across multiple seasons" />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {stats.mostDrafted.filter((p) => p.count > 1).slice(0, 10).map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-xs font-bold ${
 i < 3 ? "bg-result text-white" : "bg-paper text-ink-soft"
                    }`}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{p.name}</p>
                      <p className="text-xs text-ink-muted">{p.position} · Drafted {p.count}x ({p.years.join(", ")})</p>
                    </div>
                    <span className={`border px-2 py-0.5 text-[10px] font-bold ${POS_COLORS[p.position] || "bg-paper text-ink-soft border-rule"}`}>
                      {p.position}
                    </span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Round 1 Position Breakdown" description="What positions get taken first" />
            <CardBody>
              <div className="space-y-3">
                {Object.entries(stats.r1Pos)
                  .sort((a, b) => b[1] - a[1])
                  .map(([pos, count]) => {
                    const total = stats.totalDrafts * 12;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={pos}>
                        <div className="flex items-center justify-between text-sm">
                          <span className={`border px-2 py-0.5 text-[10px] font-bold ${POS_COLORS[pos] || "bg-paper text-ink-soft border-rule"}`}>
                            {pos}
                          </span>
                          <span className="font-mono text-ink-soft">{count} picks ({pct}%)</span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden bg-paper">
                          <div
                            className="h-full bg-result"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      <Container className="pt-0">
        <DraftHistoryClient years={years} drafts={JSON.parse(JSON.stringify(drafts))} />
      </Container>
    </>
  );
}
