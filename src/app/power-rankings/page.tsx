import type { Metadata } from "next";
import { fetchStandings, fetchSettings, fetchScoreboard } from "@/lib/server-data";
import type { Scoreboard } from "@/lib/yahoo/types";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import NotConnected, { ApiError } from "@/components/NotConnected";
import OffseasonState from "@/components/OffseasonState";
import { Card, CardBody, CardHeader } from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import { formatPoints, formatRecord, toFiniteNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Power Rankings",
  description:
    "Composite power rankings based on record, scoring, and recent performance.",
};

export const dynamic = "force-dynamic";

interface RankedTeam {
  teamKey: string;
  teamName: string;
  managerName: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  rank: number;
  /** Composite power score 0..100 */
  powerScore: number;
  /** Component scores */
  winPctScore: number;
  pointsScore: number;
  marginScore: number;
  trendScore: number;
  /** Movement from standings rank */
  movement: number;
  /** Average points over last 3 completed weeks */
  recentAvg: number;
}

export default async function PowerRankingsPage() {
  const [standingsResult, settingsResult] = await Promise.all([
    fetchStandings(),
    fetchSettings(),
  ]);

  if (!standingsResult.ok) {
    return (
      <>
        <PageHeader
          eyebrow="Rankings"
          title="Power Rankings"
          subtitle="Who's really the best? Let the numbers decide."
        />
        <Container>
          {standingsResult.notConfigured ? (
            <NotConnected resource="power rankings" />
          ) : standingsResult.offseason ? (
            <OffseasonState resource="power rankings" />
          ) : (
            <ApiError resource="power rankings" detail={standingsResult.message} />
          )}
        </Container>
      </>
    );
  }

  const teams = standingsResult.data.teams;
  if (teams.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Rankings"
          title="Power Rankings"
          subtitle="Who's really the best? Let the numbers decide."
        />
        <Container>
          <EmptyState
            icon={<span>📊</span>}
            title="No data yet"
            description="Power rankings will generate once games are played."
          />
        </Container>
      </>
    );
  }

  // Fetch recent scoreboards for trend calculation
  const currentWeek = settingsResult.ok ? settingsResult.data.currentWeek : 0;
  const recentWeeks = Math.min(3, Math.max(0, currentWeek - 1));
  const recentScoreboards: Scoreboard[] = [];
  if (recentWeeks > 0) {
    const fetches = Array.from({ length: recentWeeks }, (_, i) =>
      fetchScoreboard(currentWeek - recentWeeks + i)
    );
    const results = await Promise.all(fetches);
    for (const r of results) {
      if (r.ok) recentScoreboards.push(r.data);
    }
  }

  // Calculate recent averages per team
  const recentPoints = new Map<string, number[]>();
  for (const sb of recentScoreboards) {
    for (const m of sb.matchups) {
      if (m.status !== "postgame") continue;
      for (const t of m.teams) {
        const pts = toFiniteNumber(t.points, 0);
        const arr = recentPoints.get(t.teamKey) ?? [];
        arr.push(pts);
        recentPoints.set(t.teamKey, arr);
      }
    }
  }

  // Compute component scores (all normalized 0..1 then weighted)
  const allPF = teams.map((t) => toFiniteNumber(t.pointsFor, 0));
  const maxPF = Math.max(...allPF, 1);
  const minPF = Math.min(...allPF);
  const pfRange = maxPF - minPF || 1;

  const allMargin = teams.map(
    (t) => toFiniteNumber(t.pointsFor, 0) - toFiniteNumber(t.pointsAgainst, 0)
  );
  const maxMargin = Math.max(...allMargin);
  const minMargin = Math.min(...allMargin);
  const marginRange = maxMargin - minMargin || 1;

  // Recent trend: average points over last few weeks
  const recentAvgs = new Map<string, number>();
  for (const t of teams) {
    const pts = recentPoints.get(t.teamKey) ?? [];
    const avg = pts.length > 0 ? pts.reduce((s, p) => s + p, 0) / pts.length : toFiniteNumber(t.pointsFor, 0) / Math.max(toFiniteNumber(t.wins, 0) + toFiniteNumber(t.losses, 0) + toFiniteNumber(t.ties, 0), 1);
    recentAvgs.set(t.teamKey, Number.isFinite(avg) ? avg : 0);
  }
  const allRecent = Array.from(recentAvgs.values());
  const maxRecent = Math.max(...allRecent, 1);
  const minRecent = Math.min(...allRecent);
  const recentRange = maxRecent - minRecent || 1;

  // Weights for composite score
  const W_RECORD = 0.30;
  const W_POINTS = 0.25;
  const W_MARGIN = 0.20;
  const W_TREND = 0.25;

  const ranked: RankedTeam[] = teams.map((t) => {
    const totalGames = toFiniteNumber(t.wins, 0) + toFiniteNumber(t.losses, 0) + toFiniteNumber(t.ties, 0);
    const winPct = totalGames > 0 ? (toFiniteNumber(t.wins, 0) + toFiniteNumber(t.ties, 0) * 0.5) / totalGames : 0;
    const pf = toFiniteNumber(t.pointsFor, 0);
    const margin = pf - toFiniteNumber(t.pointsAgainst, 0);
    const recent = recentAvgs.get(t.teamKey) ?? 0;

    const winPctScore = Number.isFinite(winPct) ? winPct : 0;
    const pointsScore = (pf - minPF) / pfRange;
    const marginScore = (margin - minMargin) / marginRange;
    const trendScore = (recent - minRecent) / recentRange;

    const composite =
      winPctScore * W_RECORD +
      pointsScore * W_POINTS +
      marginScore * W_MARGIN +
      trendScore * W_TREND;

    const powerScore = Math.round(
      (Number.isFinite(composite) ? composite : 0) * 100
    );

    return {
      teamKey: t.teamKey,
      teamName: t.teamName,
      managerName: t.managerName,
      wins: t.wins,
      losses: t.losses,
      ties: t.ties,
      pointsFor: t.pointsFor,
      pointsAgainst: t.pointsAgainst,
      rank: 0, // assigned after sort
      powerScore,
      winPctScore: Math.round(winPctScore * 100),
      pointsScore: Math.round(pointsScore * 100),
      marginScore: Math.round(marginScore * 100),
      trendScore: Math.round(trendScore * 100),
      movement: 0, // assigned after sort
      recentAvg: recent,
    };
  });

  // Sort by power score descending
  ranked.sort((a, b) => b.powerScore - a.powerScore);
  ranked.forEach((t, i) => {
    t.rank = i + 1;
    // Find the original standings rank for this team
    const standingsTeam = teams.find((st) => st.teamKey === t.teamKey);
    const standingsRank = standingsTeam?.rank ?? i + 1;
    t.movement = standingsRank - t.rank; // positive = moved up from standings
  });

  return (
    <>
      <PageHeader
        eyebrow="Rankings"
        title="Power Rankings"
        subtitle="Composite score: 30% record, 25% total scoring, 20% point differential, 25% recent trend."
      />
      <Container>
        <div className="space-y-3">
          {ranked.map((t) => (
            <Card key={t.teamKey}>
              <CardBody>
                <div className="flex items-center gap-4">
                  {/* Rank badge */}
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${
                        t.rank <= 3
                          ? "bg-[#DD550C] text-[#0C2340]"
                          : t.rank <= 6
                          ? "bg-[#DD550C]/20 text-[#DD550C]"
                          : "bg-white/10 text-gray-300"
                      }`}
                    >
                      {t.rank}
                    </span>
                    {t.movement !== 0 && (
                      <span
                        className={`text-[10px] font-bold ${
                          t.movement > 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {t.movement > 0 ? `+${t.movement}` : t.movement}
                      </span>
                    )}
                  </div>

                  {/* Team info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3">
                      <h3 className="text-lg font-bold text-white truncate">
                        {t.teamName}
                      </h3>
                      <span className="text-xs text-gray-400 hidden sm:inline">
                        {t.managerName}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-400">
                      <span className="font-mono">
                        {formatRecord(t.wins, t.losses, t.ties)}
                      </span>
                      <span>
                        {formatPoints(t.pointsFor, 1)} PF
                      </span>
                      {t.recentAvg > 0 && (
                        <span className="hidden sm:inline">
                          {formatPoints(t.recentAvg, 1)} avg (last 3)
                        </span>
                      )}
                    </div>

                    {/* Component score bars */}
                    <div className="mt-3 grid grid-cols-4 gap-2 text-[10px]">
                      <ScoreBar label="Record" value={t.winPctScore} />
                      <ScoreBar label="Scoring" value={t.pointsScore} />
                      <ScoreBar label="Margin" value={t.marginScore} />
                      <ScoreBar label="Trend" value={t.trendScore} />
                    </div>
                  </div>

                  {/* Power score */}
                  <div className="flex-shrink-0 text-center">
                    <p className="font-mono text-3xl font-bold text-[#DD550C]">
                      {t.powerScore}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">
                      PWR
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Power rankings update automatically. Movement shown relative to
          standings rank.
        </p>
      </Container>
    </>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-gray-500">{label}</span>
        <span className="font-mono text-gray-300">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div
          className="h-1.5 rounded-full bg-[#DD550C]/60"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
