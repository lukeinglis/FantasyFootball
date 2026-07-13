import type { Metadata } from "next";
import Link from "next/link";
import { getManagerSlug } from "@/lib/managers";
import allTimeRecords from "@/data/all-time-records.json";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardHeader, CardBody } from "@/components/Card";
import { computeRecords, denseRanks, POS_COLORS } from "@/lib/records";

export const metadata: Metadata = {
  title: "Record Book",
  description:
    "All-time records, draft superlatives, and legendary stats from Greybushes & Chili Dogs.",
};

export default function RecordsPage() {
  const r = computeRecords();

  const top3List = Object.entries(r.top3Counts).sort((a, b) => b[1] - a[1]);

  // Precompute dense ranks for all ranked lists
  const top3Ranks = denseRanks(top3List, ([, c]) => c);
  const ironmenRanks = denseRanks(r.ironmen.slice(0, 10), im => im.consecutive);
  const loyaltyRanks = denseRanks(r.loyaltyRecords, lr => lr.count);
  const mostDraftedSlice = r.mostDrafted.slice(0, 12);
  const mostDraftedRanks = denseRanks(mostDraftedSlice, p => p.count);
  const nflTeamRanks = denseRanks(r.topNflTeams, ([, c]) => c);
  const keeperStreakSlice = r.keeperStreaks.slice(0, 12);
  const keeperStreakRanks = denseRanks(keeperStreakSlice, ks => ks.streak);
  const topKeeperSlice = r.topKeepers.slice(0, 12);
  const topKeeperRanks = denseRanks(topKeeperSlice, ([, c]) => c);

  const weeklyScoreRanks = denseRanks(allTimeRecords.leaderboards.top10WeeklyScores, s => s.points);
  const bottomScoreRanks = denseRanks(allTimeRecords.leaderboards.bottom10WeeklyScores, s => s.points);
  const blowoutRanks = denseRanks(allTimeRecords.leaderboards.top10Blowouts, s => s.margin);
  const closestRanks = denseRanks(allTimeRecords.leaderboards.top10ClosestGames, s => s.margin);
  const seasonPtsRanks = denseRanks(allTimeRecords.leaderboards.topSeasonPointTotals, s => s.points);
  const avgPtsRanks = denseRanks(allTimeRecords.leaderboards.avgPointsPerManager, s => s.avgPoints);

  return (
    <>
      <PageHeader
        eyebrow="Hall of Records"
        title="Record Book"
        subtitle={`${r.totalPicks.toLocaleString()} picks. ${r.totalSeasons} seasons. ${r.uniqueChamps} unique champions. The numbers that define the league.`}
      />

      {/* Stats Banner */}
      <Container>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <StatCard label="Total Picks" value={r.totalPicks.toLocaleString()} />
          <StatCard label="Matchups Played" value={allTimeRecords.totalMatchups.toLocaleString()} />
          <StatCard label="Unique Champs" value={String(r.uniqueChamps)} highlight />
          <StatCard label="Seasons" value={String(r.totalSeasons)} />
        </div>
      </Container>

      {/* All-Time Scoring Records */}
      <Container className="pt-0">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-wide text-[#F5F0E8] mb-6">All-Time Records</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <RecordCard
            title="Highest Weekly Score"
            value={String(allTimeRecords.allTime.mostPointsWeek.value)}
            unit="pts"
            holder={allTimeRecords.allTime.mostPointsWeek.holder}
            detail={`Week ${allTimeRecords.allTime.mostPointsWeek.week}, ${allTimeRecords.allTime.mostPointsWeek.season}`}
            accent="text-[#4CAF50]"
          />
          <RecordCard
            title="Lowest Weekly Score"
            value={String(allTimeRecords.allTime.fewestPointsWeek.value)}
            unit="pts"
            holder={allTimeRecords.allTime.fewestPointsWeek.holder}
            detail={`Week ${allTimeRecords.allTime.fewestPointsWeek.week}, ${allTimeRecords.allTime.fewestPointsWeek.season}`}
            accent="text-red-400"
          />
          <RecordCard
            title="Highest Playoff Score"
            value={String(allTimeRecords.allTime.highestPlayoffScore?.value || 0)}
            unit="pts"
            holder={allTimeRecords.allTime.highestPlayoffScore?.holder || ""}
            detail={`Week ${allTimeRecords.allTime.highestPlayoffScore?.week || ""}, ${allTimeRecords.allTime.highestPlayoffScore?.season || ""}`}
            accent="text-[#D4A847]"
          />
          <RecordCard
            title="Best Season Total"
            value={allTimeRecords.allTime.mostPointsSeason.value.toLocaleString()}
            unit="pts"
            holder={allTimeRecords.allTime.mostPointsSeason.holder}
            detail={`${allTimeRecords.allTime.mostPointsSeason.season} (${allTimeRecords.allTime.mostPointsSeason.games} games)`}
            accent="text-[#4CAF50]"
          />
          <RecordCard
            title="Best Record"
            value={allTimeRecords.allTime.bestRecord.value}
            holder={allTimeRecords.allTime.bestRecord.holder}
            detail={String(allTimeRecords.allTime.bestRecord.season)}
            accent="text-[#4CAF50]"
          />
          <RecordCard
            title="Worst Record"
            value={allTimeRecords.allTime.worstRecord.value}
            holder={allTimeRecords.allTime.worstRecord.holder}
            detail={String(allTimeRecords.allTime.worstRecord.season)}
            accent="text-red-400"
          />
          <RecordCard
            title="Longest Win Streak"
            value={String(allTimeRecords.allTime.longestWinStreak.value)}
            unit="wins"
            holder={allTimeRecords.allTime.longestWinStreak.holder}
            detail={String(allTimeRecords.allTime.longestWinStreak.season)}
            accent="text-[#4CAF50]"
          />
          <RecordCard
            title="Longest Losing Streak"
            value={String(allTimeRecords.allTime.longestLosingStreak.value)}
            unit="losses"
            holder={allTimeRecords.allTime.longestLosingStreak.holder}
            detail={String(allTimeRecords.allTime.longestLosingStreak.season)}
            accent="text-red-400"
          />
          <RecordCard
            title="Biggest Blowout"
            value={String(allTimeRecords.allTime.biggestBlowout.margin)}
            unit="pts"
            holder={`${allTimeRecords.allTime.biggestBlowout.winner} over ${allTimeRecords.allTime.biggestBlowout.loser}`}
            detail={`${allTimeRecords.allTime.biggestBlowout.score}, Week ${allTimeRecords.allTime.biggestBlowout.week}, ${allTimeRecords.allTime.biggestBlowout.season}`}
            accent="text-[#DD550C]"
          />
          <RecordCard
            title="Closest Game"
            value={String(allTimeRecords.allTime.closestGame.margin)}
            unit="pts"
            holder={`${allTimeRecords.allTime.closestGame.winner} over ${allTimeRecords.allTime.closestGame.loser}`}
            detail={`${allTimeRecords.allTime.closestGame.score}, Week ${allTimeRecords.allTime.closestGame.week}, ${allTimeRecords.allTime.closestGame.season}`}
            accent="text-sky-400"
          />
        </div>
      </Container>

      {/* Leaderboards */}
      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Weekly Scores */}
          <Card className="overflow-hidden">
            <CardHeader title="Top 10 Weekly Scores" description="Highest single-week performances in league history" />
            <CardBody className="!p-0">
              <div className="divide-y divide-[#D4A847]/10">
                {allTimeRecords.leaderboards.top10WeeklyScores.map((s, i) => (
                  <div key={`${s.season}-${s.week}-${s.manager}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${weeklyScoreRanks[i] <= 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-[#F5F0E8]/60"}`}>{weeklyScoreRanks[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[#F5F0E8]">
                        <Link href={`/managers/${getManagerSlug(s.manager)}`} className="font-semibold hover:text-[#DD550C]">{s.manager}</Link>
                      </p>
                      <p className="text-xs text-[#F5F0E8]/50">vs {s.opponent} · Week {s.week}, {s.season}</p>
                    </div>
                    <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#4CAF50]">{s.points}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Bottom Weekly Scores */}
          <Card className="overflow-hidden">
            <CardHeader title="Bottom 10 Weekly Scores" description="The weeks managers would rather forget" />
            <CardBody className="!p-0">
              <div className="divide-y divide-[#D4A847]/10">
                {allTimeRecords.leaderboards.bottom10WeeklyScores.map((s, i) => (
                  <div key={`${s.season}-${s.week}-${s.manager}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${bottomScoreRanks[i] <= 3 ? "bg-red-600 text-white" : "bg-white/10 text-[#F5F0E8]/60"}`}>{bottomScoreRanks[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[#F5F0E8]">
                        <Link href={`/managers/${getManagerSlug(s.manager)}`} className="font-semibold hover:text-[#DD550C]">{s.manager}</Link>
                      </p>
                      <p className="text-xs text-[#F5F0E8]/50">vs {s.opponent} · Week {s.week}, {s.season}</p>
                    </div>
                    <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-red-400">{s.points}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* Blowouts & Closest Games */}
      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="Biggest Blowouts" description="Largest margins of victory in a single matchup" />
            <CardBody className="!p-0">
              <div className="divide-y divide-[#D4A847]/10">
                {allTimeRecords.leaderboards.top10Blowouts.map((s, i) => (
                  <div key={`${s.season}-${s.week}-${s.winner}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${blowoutRanks[i] <= 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-[#F5F0E8]/60"}`}>{blowoutRanks[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[#F5F0E8]">
                        <span className="font-semibold">{s.winner}</span>
                        <span className="text-[#F5F0E8]/50"> over </span>
                        <span className="font-semibold">{s.loser}</span>
                      </p>
                      <p className="text-xs text-[#F5F0E8]/50">{s.score} · Week {s.week}, {s.season}</p>
                    </div>
                    <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#DD550C]">+{s.margin}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Closest Games" description="Nail-biters decided by the smallest margins" />
            <CardBody className="!p-0">
              <div className="divide-y divide-[#D4A847]/10">
                {allTimeRecords.leaderboards.top10ClosestGames.map((s, i) => (
                  <div key={`${s.season}-${s.week}-${s.winner}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${closestRanks[i] <= 3 ? "bg-sky-600 text-white" : "bg-white/10 text-[#F5F0E8]/60"}`}>{closestRanks[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[#F5F0E8]">
                        <span className="font-semibold">{s.winner}</span>
                        <span className="text-[#F5F0E8]/50"> over </span>
                        <span className="font-semibold">{s.loser}</span>
                      </p>
                      <p className="text-xs text-[#F5F0E8]/50">{s.score} · Week {s.week}, {s.season}</p>
                    </div>
                    <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-sky-400">+{s.margin}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* Season Scoring Leaders & Avg Points */}
      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="Top Season Point Totals" description="Highest regular-season scoring outputs" />
            <CardBody className="!p-0">
              <div className="divide-y divide-[#D4A847]/10">
                {allTimeRecords.leaderboards.topSeasonPointTotals.map((s, i) => (
                  <div key={`${s.season}-${s.manager}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${seasonPtsRanks[i] <= 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-[#F5F0E8]/60"}`}>{seasonPtsRanks[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[#F5F0E8]">
                        <Link href={`/managers/${getManagerSlug(s.manager)}`} className="font-semibold hover:text-[#DD550C]">{s.manager}</Link>
                        <span className="text-[#F5F0E8]/50 text-sm"> ({s.team})</span>
                      </p>
                      <p className="text-xs text-[#F5F0E8]/50">{s.season} · {s.games} games</p>
                    </div>
                    <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#F5F0E8]">{s.points.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Career Scoring Average" description="Average points per regular-season game (min. 10 games)" />
            <CardBody className="!p-0">
              <div className="divide-y divide-[#D4A847]/10">
                {allTimeRecords.leaderboards.avgPointsPerManager.map((s, i) => {
                  const maxAvg = allTimeRecords.leaderboards.avgPointsPerManager[0]?.avgPoints || 200;
                  const pct = Math.min(100, (s.avgPoints / maxAvg) * 100);
                  return (
                    <Link key={s.manager} href={`/managers/${getManagerSlug(s.manager)}`} className="block px-5 py-2.5 hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-[10px] font-bold ${avgPtsRanks[i] <= 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-[#F5F0E8]/60"}`}>{avgPtsRanks[i]}</span>
                          <span className="font-semibold text-[#F5F0E8]">{s.manager}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-sm text-[#F5F0E8]">{s.avgPoints}</span>
                          <span className="text-xs text-[#F5F0E8]/40 ml-1">({s.games}g)</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#DD550C] to-[#ff8a3d]" style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* Dynasty Rankings */}
      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="Dynasty Rankings" description="Most top-3 finishes all time" />
            <CardBody className="!p-0">
              <div className="divide-y divide-[#D4A847]/10">
                {top3List.slice(0, 10).map(([name, count], i) => {
                  const titles = r.champCounts[name] || 0;
                  return (
                    <Link key={name} href={`/managers/${getManagerSlug(name)}`} className="flex items-center gap-3 px-5 py-3 hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-sm font-bold ${top3Ranks[i] <= 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-[#F5F0E8]/60"}`}>{top3Ranks[i]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#F5F0E8]">{name}</p>
                        <p className="text-xs text-[#F5F0E8]/50">{titles} title{titles !== 1 ? "s" : ""}, {count} podium{count !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: count }).map((_, j) => (
                          <div key={j} className={`h-2.5 w-2.5 rounded-full ${j < titles ? "bg-[#DD550C]" : "bg-[#DD550C]/30"}`} />
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Ironmen" description="Most consecutive seasons in the league" />
            <CardBody className="!p-0">
              <div className="divide-y divide-[#D4A847]/10">
                {r.ironmen.slice(0, 10).map((im, i) => (
                  <Link key={im.name} href={`/managers/${getManagerSlug(im.name)}`} className="flex items-center gap-3 px-5 py-3 hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                    <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-sm font-bold ${ironmenRanks[i] <= 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-[#F5F0E8]/60"}`}>{ironmenRanks[i]}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-[#F5F0E8]">{im.name}</p>
                      <p className="text-xs text-[#F5F0E8]/50">{im.first} to {im.last}</p>
                    </div>
                    <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#F5F0E8]">{im.consecutive}</span>
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* Bridesmaid Award */}
      {r.bridesmaids.length > 0 && (
        <Container className="pt-0">
          <Card className="overflow-hidden" variant="chalkboard">
            <CardHeader title="Bridesmaid Award" description="Most runner-up finishes without ever winning the title" variant="chalkboard" />
            <CardBody variant="chalkboard">
              <div className="flex flex-wrap gap-4">
                {r.bridesmaids.map(([name, count]) => (
                  <Link key={name} href={`/managers/${getManagerSlug(name)}`} className="flex items-center gap-3 rounded-xl bg-[#D4A847]/5 border border-[#D4A847]/20 px-4 py-3 hover:bg-[#D4A847]/10 transition-colors">
                    <span className="text-2xl">🥈</span>
                    <div>
                      <p className="font-[family-name:var(--font-heading)] font-bold text-[#F5F0E8] uppercase">{name}</p>
                      <p className="text-xs text-[#D4A847]">{count} runner-up finish{count > 1 ? "es" : ""}, 0 titles</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>
        </Container>
      )}

      {/* Draft Records */}
      <Container className="pt-0">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-wide text-[#F5F0E8] mb-6">Draft Records</h2>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Loyalty Records */}
          <Card className="overflow-hidden">
            <CardHeader title="Most Loyal Drafters" description="Same manager drafting the same player across seasons" />
            <CardBody className="!p-0">
              <div className="divide-y divide-[#D4A847]/10">
                {r.loyaltyRecords.map((lr, i) => (
                  <div key={`${lr.manager}-${lr.player}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${loyaltyRanks[i] <= 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-[#F5F0E8]/60"}`}>{loyaltyRanks[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[#F5F0E8]">
                        <span className="font-semibold">{lr.manager}</span>
                        <span className="text-[#F5F0E8]/50"> drafted </span>
                        <span className="font-semibold">{lr.player}</span>
                      </p>
                      <span className={`rounded-full border px-1.5 py-0 text-[9px] font-bold ${POS_COLORS[lr.pos] || "bg-white/10 text-[#F5F0E8]/70 border-white/20"}`}>{lr.pos}</span>
                    </div>
                    <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#DD550C]">{lr.count}x</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Most Drafted Players */}
          <Card className="overflow-hidden">
            <CardHeader title="Most Drafted Players" description="Players taken most times across all league drafts" />
            <CardBody className="!p-0">
              <div className="divide-y divide-[#D4A847]/10">
                {mostDraftedSlice.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${mostDraftedRanks[i] <= 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-[#F5F0E8]/60"}`}>{mostDraftedRanks[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold text-[#F5F0E8]">{p.name}</p>
                      <p className="text-xs text-[#F5F0E8]/50">{p.nflTeam}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${POS_COLORS[p.pos] || "bg-white/10 text-[#F5F0E8]/70 border-white/20"}`}>{p.pos}</span>
                    <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#F5F0E8]">{p.count}x</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* First Overall Picks + QB Timer */}
      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="#1 Overall Picks" description="Every first pick in league history" />
            <CardBody className="!p-0">
              <div className="divide-y divide-[#D4A847]/10">
                {r.firstOveralls.map((fo) => (
                  <div key={fo.year} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                    <span className="font-[family-name:var(--font-heading)] font-mono text-lg font-bold text-[#DD550C] w-12">{fo.year}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#F5F0E8]">{fo.player}</p>
                      <p className="text-xs text-[#F5F0E8]/50">{fo.pos} · {fo.nflTeam}</p>
                    </div>
                    <Link href={`/managers/${getManagerSlug(fo.manager)}`} className="text-sm text-[#F5F0E8]/50 hover:text-[#DD550C]">{fo.manager}</Link>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="QB Timer" description="Average round of first QB pick (earliest to latest)" />
            <CardBody className="!p-0">
              <div className="divide-y divide-[#D4A847]/10">
                {r.qbTimers.map((qt, i) => {
                  const maxAvg = r.qbTimers[r.qbTimers.length - 1]?.avg || 16;
                  const pct = Math.min(100, (qt.avg / maxAvg) * 100);
                  return (
                    <Link key={qt.name} href={`/managers/${getManagerSlug(qt.name)}`} className="block px-5 py-2.5 hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[#F5F0E8] text-sm">{qt.name}</span>
                        <span className="font-mono text-sm text-[#F5F0E8]/70">R{qt.avg.toFixed(1)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full rounded-full ${qt.avg <= 4 ? "bg-rose-500" : qt.avg <= 7 ? "bg-sky-500" : "bg-gray-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* NFL Teams + R1 Trends */}
      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="Most Drafted NFL Teams" description="Total picks from each NFL franchise across all drafts" />
            <CardBody className="!p-0">
              <div className="divide-y divide-[#D4A847]/10">
                {r.topNflTeams.map(([team, count], i) => {
                  const maxCount = r.topNflTeams[0]?.[1] || 1;
                  const pct = (count / maxCount) * 100;
                  return (
                    <div key={team} className="px-5 py-2.5 hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-[10px] font-bold ${nflTeamRanks[i] <= 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-[#F5F0E8]/60"}`}>{nflTeamRanks[i]}</span>
                          <span className="font-semibold text-[#F5F0E8]">{team}</span>
                        </div>
                        <span className="font-mono text-sm text-[#F5F0E8]/60">{count} picks</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#DD550C] to-[#ff8a3d]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Round 1 Evolution" description="How first-round position preferences have shifted" />
            <CardBody className="!p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase tracking-wider text-[#D4A847] border-b-2 border-[#D4A847]/30">
                    <tr>
                      <th className="px-3 py-2 text-left">Year</th>
                      <th className="px-3 py-2 text-center">RB</th>
                      <th className="px-3 py-2 text-center">WR</th>
                      <th className="px-3 py-2 text-center">QB</th>
                      <th className="px-3 py-2 text-center">TE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D4A847]/10">
                    {r.r1ByYear.map((yr) => (
                      <tr key={yr.year} className="hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                        <td className="px-3 py-2 font-[family-name:var(--font-heading)] font-bold text-[#DD550C]">{yr.year}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-300 font-bold">{yr.positions["RB"] || 0}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-block rounded bg-sky-500/20 px-2 py-0.5 text-sky-300 font-bold">{yr.positions["WR"] || 0}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block rounded px-2 py-0.5 font-bold ${yr.positions["QB"] ? "bg-rose-500/20 text-rose-300" : "text-[#F5F0E8]/30"}`}>{yr.positions["QB"] || 0}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block rounded px-2 py-0.5 font-bold ${yr.positions["TE"] ? "bg-[#D4A847]/20 text-[#D4A847]" : "text-[#F5F0E8]/30"}`}>{yr.positions["TE"] || 0}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* Keeper Records */}
      <Container className="pt-0">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-wide text-[#F5F0E8] mb-6">Keeper Records</h2>
        <p className="mb-6 text-sm text-[#F5F0E8]/50">
          {r.totalKeepers} keepers across 10 seasons. Early years (2016-2022): keepers slotted into the final rounds (14-16).
          Since 2023: keepers held at their original draft round.
        </p>

        {/* Keeper stats banner */}
        <div className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
          <StatCard label="Total Keepers" value={r.totalKeepers.toString()} />
          <StatCard label="Avg / Draft" value={r.keepersByYear.length > 1 ? Math.round(r.totalKeepers / (r.keepersByYear.length - 1)).toString() : "0"} />
          <StatCard label="Longest Streak" value={r.keeperStreaks[0]?.streak.toString() || "0"} highlight />
          <StatCard label="Seasons Tracked" value={(r.keepersByYear.length - 1).toString()} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Longest Keeper Streaks */}
          <Card className="overflow-hidden">
            <CardHeader title="Longest Keeper Streaks" description="Same manager, same player, most consecutive seasons" />
            <CardBody className="!p-0">
              <div className="divide-y divide-[#D4A847]/10">
                {keeperStreakSlice.map((ks, i) => (
                  <div key={`${ks.manager}-${ks.player}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${keeperStreakRanks[i] <= 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-[#F5F0E8]/60"}`}>{keeperStreakRanks[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[#F5F0E8]">
                        <Link href={`/managers/${getManagerSlug(ks.manager)}`} className="font-semibold hover:text-[#DD550C]">{ks.manager}</Link>
                        <span className="text-[#F5F0E8]/50"> kept </span>
                        <span className="font-semibold">{ks.player}</span>
                      </p>
                      <p className="text-xs text-[#F5F0E8]/50">{ks.years[0]} to {ks.years[ks.years.length - 1]}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#DD550C]">{ks.streak}</span>
                      <span className="text-xs text-[#F5F0E8]/40 ml-1">yrs</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Most Keepers by Manager */}
          <Card className="overflow-hidden">
            <CardHeader title="Keeper Volume" description="Total keeper picks per manager (all time)" />
            <CardBody className="!p-0">
              <div className="divide-y divide-[#D4A847]/10">
                {topKeeperSlice.map(([name, count], i) => {
                  const maxCount = topKeeperSlice[0]?.[1] || 1;
                  const pct = (count / maxCount) * 100;
                  return (
                    <Link key={name} href={`/managers/${getManagerSlug(name)}`} className="block px-5 py-2.5 hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-[10px] font-bold ${topKeeperRanks[i] <= 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-[#F5F0E8]/60"}`}>{topKeeperRanks[i]}</span>
                          <span className="font-semibold text-[#F5F0E8]">{name}</span>
                        </div>
                        <span className="font-mono text-sm text-[#F5F0E8]/60">{count} keepers</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#DD550C] to-[#ff8a3d]" style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Keepers by Year */}
        <div className="mt-6">
          <Card className="overflow-hidden">
            <CardHeader title="Keepers by Season" description="How many players were kept each year" />
            <CardBody>
              <div className="flex items-end gap-2 h-32">
                {r.keepersByYear.map((ky) => {
                  const pct = ky.total > 0 ? (ky.keepers / ky.total) * 100 : 0;
                  const heightPct = Math.max(4, (ky.keepers / 50) * 100);
                  return (
                    <div key={ky.year} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-mono text-[#F5F0E8]/50">{ky.keepers}</span>
                      <div className="w-full rounded-t bg-gradient-to-t from-[#DD550C] to-[#ff8a3d]" style={{ height: `${heightPct}%` }} />
                      <span className="text-[9px] text-[#F5F0E8]/40">{String(ky.year).slice(2)}</span>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>
    </>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div data-testid="stat-card">
    <Card variant="scoreboard">
      <CardBody>
        <div className="text-center">
          <p className="font-[family-name:var(--font-heading)] text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5F0E8]/50">{label}</p>
          <p className={`mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold ${highlight ? "text-[#FFD23F] text-shadow-glow-yellow" : "text-[#F5F0E8]"}`}>{value}</p>
        </div>
      </CardBody>
    </Card>
    </div>
  );
}

function RecordCard({ title, value, unit, holder, detail, accent }: {
  title: string; value: string; unit?: string; holder: string; detail: string; accent?: string;
}) {
  const accentColor = accent === "text-[#4CAF50]" ? "text-[#4CAF50]"
    : accent === "text-[#D4A847]" ? "text-[#D4A847]"
    : accent === "text-red-400" ? "text-red-400"
    : accent === "text-sky-400" ? "text-sky-400"
    : accent || "text-[#F5F0E8]";
  return (
    <div data-testid="record-card">
    <Card variant="chalkboard">
      <CardBody variant="chalkboard">
        <p className="font-[family-name:var(--font-heading)] text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5F0E8]/50 mb-2">{title}</p>
        <p className={`font-[family-name:var(--font-heading)] text-3xl font-bold ${accentColor}`}>
          {value}
          {unit && <span className="text-sm font-normal text-[#F5F0E8]/50 ml-1">{unit}</span>}
        </p>
        <p className="mt-1 text-sm font-semibold text-[#F5F0E8] truncate">{holder}</p>
        <p className="text-xs text-[#F5F0E8]/50">{detail}</p>
      </CardBody>
    </Card>
    </div>
  );
}
