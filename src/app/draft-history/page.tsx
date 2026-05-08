import type { Metadata } from "next";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardBody, CardHeader } from "@/components/Card";
import DraftHistoryClient from "@/components/DraftHistoryClient";

export const metadata: Metadata = {
  title: "Draft History",
  description: "Every pick from every draft in Greybushes & Chili Dogs history.",
};

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

  // Position breakdown across all drafts
  const posCounts: Record<string, number> = {};
  for (const p of allPicks) {
    const pos = p.position || "Unknown";
    posCounts[pos] = (posCounts[pos] || 0) + 1;
  }

  // First round pick frequency by position
  const r1Pos: Record<string, number> = {};
  for (const p of allPicks.filter((p) => p.round === 1)) {
    const pos = p.position || "Unknown";
    r1Pos[pos] = (r1Pos[pos] || 0) + 1;
  }

  // Most drafted players (across all years)
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

  // Earliest average pick by manager (who drafts highest)
  const managerPicks: Record<string, number[]> = {};
  for (const p of allPicks) {
    const mgr = p.managerName || p.teamName;
    if (!mgr) continue;
    if (!managerPicks[mgr]) managerPicks[mgr] = [];
    managerPicks[mgr].push(p.pick);
  }

  // Number 1 overall picks by year
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

  return { totalPicks, totalDrafts, posCounts, r1Pos, mostDrafted, firstOveralls };
}

export default function DraftHistoryPage() {
  const drafts = loadDrafts();
  const stats = computeStats(drafts);
  const years = drafts.map((d) => d.year);

  const posColors: Record<string, string> = {
    QB: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    RB: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    WR: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    TE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    K: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    DEF: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  };

  return (
    <>
      <PageHeader
        eyebrow="The Archives"
        title="Draft History"
        subtitle={`${stats.totalPicks.toLocaleString()} picks across ${stats.totalDrafts} drafts. Every reach, every steal, every "who?"`}
      />

      {/* Stats Banner */}
      <Container>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card variant="glass">
            <CardBody>
              <div className="text-center">
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Total Picks</p>
                <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-gradient">{stats.totalPicks.toLocaleString()}</p>
              </div>
            </CardBody>
          </Card>
          <Card variant="glass">
            <CardBody>
              <div className="text-center">
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Drafts</p>
                <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-gradient">{stats.totalDrafts}</p>
              </div>
            </CardBody>
          </Card>
          <Card variant="glass">
            <CardBody>
              <div className="text-center">
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Rounds / Draft</p>
                <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-gradient">16</p>
              </div>
            </CardBody>
          </Card>
          <Card variant="glass">
            <CardBody>
              <div className="text-center">
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Teams / Draft</p>
                <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-gradient">12</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* #1 Overall Picks */}
      <Container className="pt-0">
        <Card className="overflow-hidden">
          <CardHeader title="First Overall Picks" description="The #1 pick from every draft" />
          <CardBody className="!p-0">
            <div className="divide-y divide-white/5">
              {stats.firstOveralls.map((fo) => (
                <div key={fo.year} className="flex items-center gap-4 px-5 py-3 hover:bg-white/5 transition-colors">
                  <span className="font-[family-name:var(--font-heading)] font-mono text-lg font-bold text-[#DD550C]">{fo.year}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{fo.player}</p>
                    <p className="text-xs text-gray-400">{fo.position} · {fo.nflTeam}</p>
                  </div>
                  <span className="text-sm text-gray-400">by {fo.manager}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </Container>

      {/* Most Drafted Players + Position Breakdown */}
      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="Most Drafted Players" description="Players drafted across multiple seasons" />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {stats.mostDrafted.filter((p) => p.count > 1).slice(0, 10).map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${
                      i < 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-gray-300"
                    }`}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.position} · Drafted {p.count}x ({p.years.join(", ")})</p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${posColors[p.position] || "bg-white/10 text-gray-200 border-white/20"}`}>
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
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${posColors[pos] || "bg-white/10 text-gray-200 border-white/20"}`}>
                            {pos}
                          </span>
                          <span className="font-mono text-gray-300">{count} picks ({pct}%)</span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#DD550C] to-[#ff8a3d]"
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

      {/* Interactive Draft Board */}
      <Container className="pt-0">
        <DraftHistoryClient years={years} drafts={JSON.parse(JSON.stringify(drafts))} />
      </Container>
    </>
  );
}
