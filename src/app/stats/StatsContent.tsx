import type { LeagueStandings, Scoreboard } from "@/lib/yahoo/types";
import { Card, CardBody, CardHeader } from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import { formatPoints, formatRecord, toFiniteNumber } from "@/lib/format";

interface WeekStat {
  week: number;
  teamName: string;
  managerName: string;
  points: number;
}

interface MatchupStat {
  week: number;
  winnerName: string;
  loserName: string;
  winnerPoints: number;
  loserPoints: number;
  margin: number;
}

interface StatsContentProps {
  teams: LeagueStandings["teams"];
  scoreboards: Scoreboard[];
}

export default function StatsContent({ teams, scoreboards }: StatsContentProps) {
  const hasData = teams.length > 0;
  const hasMatchups = scoreboards.length > 0;

  if (!hasData) {
    return (
      <EmptyState
        icon={<span>📊</span>}
        title="No stats yet"
        description="Stats will populate once the season gets rolling and games are played."
      />
    );
  }

  return (
    <div className="space-y-6">
      <TeamRankings teams={teams} />
      {hasMatchups && <MatchupSuperlatives scoreboards={scoreboards} />}
      {hasMatchups && <ScoringLeaders scoreboards={scoreboards} />}
    </div>
  );
}

function TeamRankings({ teams }: { teams: LeagueStandings["teams"] }) {
  const byPointsFor = [...teams].sort(
    (a, b) => toFiniteNumber(b.pointsFor, 0) - toFiniteNumber(a.pointsFor, 0)
  );
  const byPointsAgainst = [...teams].sort(
    (a, b) => toFiniteNumber(a.pointsAgainst, 0) - toFiniteNumber(b.pointsAgainst, 0)
  );

  const byDifferential = [...teams]
    .map((t) => ({
      ...t,
      differential: toFiniteNumber(t.pointsFor, 0) - toFiniteNumber(t.pointsAgainst, 0),
    }))
    .sort((a, b) => b.differential - a.differential);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card variant="scoreboard">
        <CardHeader title="Top Scorers" description="Most total points scored" />
        <CardBody className="!p-0">
          <RankList
            items={byPointsFor.slice(0, 5).map((t, i) => ({
              rank: i + 1,
              name: t.teamName,
              detail: t.managerName,
              value: formatPoints(t.pointsFor, 1),
              highlight: i === 0,
            }))}
          />
        </CardBody>
      </Card>

      <Card variant="scoreboard">
        <CardHeader title="Best Defense" description="Fewest points allowed" />
        <CardBody className="!p-0">
          <RankList
            items={byPointsAgainst.slice(0, 5).map((t, i) => ({
              rank: i + 1,
              name: t.teamName,
              detail: t.managerName,
              value: formatPoints(t.pointsAgainst, 1),
              highlight: i === 0,
            }))}
          />
        </CardBody>
      </Card>

      <Card variant="scoreboard">
        <CardHeader title="Point Differential" description="PF minus PA" />
        <CardBody className="!p-0">
          <RankList
            items={byDifferential.slice(0, 5).map((t, i) => ({
              rank: i + 1,
              name: t.teamName,
              detail: formatRecord(t.wins, t.losses, t.ties),
              value: `${t.differential >= 0 ? "+" : ""}${formatPoints(t.differential, 1)}`,
              highlight: i === 0,
            }))}
          />
        </CardBody>
      </Card>
    </div>
  );
}

function MatchupSuperlatives({ scoreboards }: { scoreboards: Scoreboard[] }) {
  const allMatchupStats: MatchupStat[] = [];
  const allWeekScores: WeekStat[] = [];

  for (const sb of scoreboards) {
    for (const m of sb.matchups) {
      if (m.status !== "postgame") continue;
      const [a, b] = m.teams;
      const aPts = toFiniteNumber(a.points, 0);
      const bPts = toFiniteNumber(b.points, 0);

      allWeekScores.push(
        { week: m.week, teamName: a.teamName, managerName: a.managerName, points: aPts },
        { week: m.week, teamName: b.teamName, managerName: b.managerName, points: bPts }
      );

      const winner = aPts >= bPts ? a : b;
      const loser = aPts >= bPts ? b : a;
      const winPts = Math.max(aPts, bPts);
      const losePts = Math.min(aPts, bPts);

      allMatchupStats.push({
        week: m.week,
        winnerName: winner.teamName,
        loserName: loser.teamName,
        winnerPoints: winPts,
        loserPoints: losePts,
        margin: winPts - losePts,
      });
    }
  }

  if (allMatchupStats.length === 0) return null;

  const highestScore = [...allWeekScores].sort((a, b) => b.points - a.points)[0];
  const lowestScore = [...allWeekScores].sort((a, b) => a.points - b.points)[0];
  const biggestBlowout = [...allMatchupStats].sort((a, b) => b.margin - a.margin)[0];
  const closestGame = [...allMatchupStats].sort((a, b) => a.margin - b.margin)[0];

  const allPointsAvg = allWeekScores.reduce((s, w) => s + w.points, 0) / Math.max(allWeekScores.length, 1);
  const upsets = allMatchupStats
    .filter((m) => m.loserPoints > allPointsAvg)
    .sort((a, b) => a.margin - b.margin);
  const biggestUpset = upsets.length > 0 ? upsets[0] : null;

  const stats = [
    highestScore && {
      icon: "💥",
      label: "Highest Score",
      primary: `${formatPoints(highestScore.points, 1)} pts`,
      secondary: `${highestScore.teamName}, Week ${highestScore.week}`,
    },
    lowestScore && {
      icon: "😬",
      label: "Lowest Score",
      primary: `${formatPoints(lowestScore.points, 1)} pts`,
      secondary: `${lowestScore.teamName}, Week ${lowestScore.week}`,
    },
    biggestBlowout && {
      icon: "🔨",
      label: "Biggest Blowout",
      primary: `${formatPoints(biggestBlowout.margin, 1)} pt margin`,
      secondary: `${biggestBlowout.winnerName} over ${biggestBlowout.loserName}, Wk ${biggestBlowout.week}`,
    },
    closestGame && {
      icon: "😰",
      label: "Closest Game",
      primary: `${formatPoints(closestGame.margin, 2)} pt margin`,
      secondary: `${closestGame.winnerName} vs ${closestGame.loserName}, Wk ${closestGame.week}`,
    },
    biggestUpset && {
      icon: "🤯",
      label: "Biggest Upset",
      primary: `${formatPoints(biggestUpset.loserPoints, 1)} pts lost to ${formatPoints(biggestUpset.winnerPoints, 1)}`,
      secondary: `${biggestUpset.loserName} upset by ${biggestUpset.winnerName}, Wk ${biggestUpset.week}`,
    },
  ].filter(
    (s): s is { icon: string; label: string; primary: string; secondary: string } => Boolean(s)
  );

  return (
    <Card variant="scoreboard">
      <CardHeader
        title="Season Superlatives"
        description="The highs, lows, and everything in between."
      />
      <CardBody>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg bg-white/5 border border-[#D4A847]/10 p-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden>
                  {s.icon}
                </span>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#DD550C]/80">
                  {s.label}
                </p>
              </div>
              <p className="mt-2 text-lg font-bold text-[#F5F0E8]">
                {s.primary}
              </p>
              <p className="mt-0.5 text-xs text-[#F5F0E8]/50">
                {s.secondary}
              </p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function ScoringLeaders({ scoreboards }: { scoreboards: Scoreboard[] }) {
  const teamTotals = new Map<string, { name: string; manager: string; totalPts: number; games: number; highWeek: number; lowWeek: number }>();

  for (const sb of scoreboards) {
    for (const m of sb.matchups) {
      if (m.status !== "postgame") continue;
      for (const t of m.teams) {
        const pts = toFiniteNumber(t.points, 0);
        const existing = teamTotals.get(t.teamKey);
        if (existing) {
          existing.totalPts += pts;
          existing.games += 1;
          existing.highWeek = Math.max(existing.highWeek, pts);
          existing.lowWeek = Math.min(existing.lowWeek, pts);
        } else {
          teamTotals.set(t.teamKey, {
            name: t.teamName,
            manager: t.managerName,
            totalPts: pts,
            games: 1,
            highWeek: pts,
            lowWeek: pts,
          });
        }
      }
    }
  }

  const teams = Array.from(teamTotals.values());
  if (teams.length === 0) return null;

  const byAvg = teams
    .map((t) => ({
      ...t,
      avg: t.games > 0 ? t.totalPts / t.games : 0,
      consistency: t.highWeek - t.lowWeek,
    }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <Card variant="scoreboard">
      <CardHeader
        title="Scoring Breakdown"
        description="Per-game averages, highs, lows, and consistency."
      />
      <CardBody className="!p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-[#D4A847]/30">
                <th className="px-3 py-3 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">#</th>
                <th className="px-3 py-3 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">Team</th>
                <th className="px-3 py-3 text-right font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">Avg/Game</th>
                <th className="px-3 py-3 text-right hidden sm:table-cell font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">High</th>
                <th className="px-3 py-3 text-right hidden sm:table-cell font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">Low</th>
                <th className="px-3 py-3 text-right hidden md:table-cell font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">Range</th>
                <th className="px-3 py-3 text-right hidden md:table-cell font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[#D4A847]">Games</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {byAvg.map((t, i) => (
                <tr
                  key={t.name}
                  className="hover:bg-[rgba(212,168,71,0.08)] transition-colors"
                >
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${
                        i < 3
                          ? "bg-[#DD550C] text-white"
                          : "bg-white/10 text-[#F5F0E8]/60"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-[#F5F0E8]">{t.name}</p>
                    <p className="text-xs text-[#F5F0E8]/50">{t.manager}</p>
                  </td>
                  <td className="px-3 py-3 text-right font-[family-name:var(--font-heading)] text-[#DD550C]">
                    {formatPoints(t.avg, 1)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-emerald-300 hidden sm:table-cell">
                    {formatPoints(t.highWeek, 1)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-red-300 hidden sm:table-cell">
                    {formatPoints(t.lowWeek, 1)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[#F5F0E8]/50 hidden md:table-cell">
                    {formatPoints(t.consistency, 1)}
                  </td>
                  <td className="px-3 py-3 text-right text-[#F5F0E8]/50 hidden md:table-cell">
                    {t.games}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

function RankList({
  items,
}: {
  items: Array<{
    rank: number;
    name: string;
    detail: string;
    value: string;
    highlight?: boolean;
  }>;
}) {
  return (
    <ol className="divide-y divide-[#D4A847]/10">
      {items.map((item) => (
        <li
          key={`${item.rank}-${item.name}`}
          className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[rgba(212,168,71,0.08)] transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${
                item.highlight
                  ? "bg-[#DD550C] text-white"
                  : "bg-white/10 text-[#F5F0E8]/60"
              }`}
            >
              {item.rank}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-[#F5F0E8]">{item.name}</p>
              <p className="truncate text-xs text-[#F5F0E8]/50">{item.detail}</p>
            </div>
          </div>
          <span className="flex-shrink-0 font-[family-name:var(--font-heading)] text-sm text-[#DD550C]">
            {item.value}
          </span>
        </li>
      ))}
    </ol>
  );
}
