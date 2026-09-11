import Link from "next/link";
import { getManagerSlug } from "@/lib/managers";
import allTimeRecords from "@/data/all-time-records.json";
import Container from "@/components/Container";
import { Card, CardHeader, CardBody } from "@/components/Card";
import { computeRecords, denseRanks, POS_COLORS } from "@/lib/records";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div data-testid="stat-card">
    <Card variant="scoreboard">
      <CardBody>
        <div className="text-center">
          <p className="font-[family-name:var(--wire-mono)] text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">{label}</p>
          <p className="mt-1 font-[family-name:var(--wire-display)] text-3xl font-extrabold tabular-nums text-ink">{value}</p>
        </div>
      </CardBody>
    </Card>
    </div>
  );
}

/**
 * Records are facts, so the number itself is set in ink. What kind of record it
 * is gets carried by a 3px rule across the top, matching the award cards:
 * gold for a peak, purple for a low, red for a margin. The old version tinted
 * the number itself in four hues, two of which (red-400, sky-400) did not clear
 * contrast against paper.
 */
type RecordTone = "peak" | "low" | "margin";

const RECORD_RULE: Record<RecordTone, string> = {
  peak: "bg-record",
  low: "bg-punishment",
  margin: "bg-result",
};

const RECORD_LABEL: Record<RecordTone, string> = {
  peak: "Peak",
  low: "Low",
  margin: "Margin",
};

const RECORD_LABEL_TEXT: Record<RecordTone, string> = {
  peak: "text-record",
  low: "text-punishment",
  margin: "text-result",
};

function RecordCard({ title, value, unit, holder, detail, tone }: {
  title: string; value: string; unit?: string; holder: string; detail: string; tone: RecordTone;
}) {
  return (
    <div data-testid="record-card" className="border border-rule bg-surface">
      <div className={`h-[3px] ${RECORD_RULE[tone]}`} />
      <div className="px-4 py-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.14em] text-ink-muted">{title}</p>
          <span className={`flex-shrink-0 font-[family-name:var(--wire-mono)] text-[9px] uppercase tracking-[0.14em] ${RECORD_LABEL_TEXT[tone]}`}>
            {RECORD_LABEL[tone]}
          </span>
        </div>
        <p className="mt-2 font-[family-name:var(--wire-display)] text-[32px] font-extrabold leading-none tabular-nums text-ink">
          {value}
          {unit && <span className="ml-1 font-[family-name:var(--wire-mono)] text-[12px] font-normal tracking-[0.1em] text-ink-muted">{unit}</span>}
        </p>
        <p className="mt-2 truncate text-sm font-semibold text-ink">{holder}</p>
        <p className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.1em] text-ink-faint">{detail}</p>
      </div>
    </div>
  );
}

export default function RecordsContent() {
  const r = computeRecords();

  const top3List = Object.entries(r.top3Counts).sort((a, b) => b[1] - a[1]);

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
      <Container>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <StatCard label="Total Picks" value={r.totalPicks.toLocaleString()} />
          <StatCard label="Matchups Played" value={allTimeRecords.totalMatchups.toLocaleString()} />
          <StatCard label="Unique Champs" value={String(r.uniqueChamps)} />
          <StatCard label="Seasons" value={String(r.totalSeasons)} />
        </div>
      </Container>

      <Container className="pt-0">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-wide text-ink mb-6">All-Time Records</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <RecordCard title="Highest Weekly Score" value={String(allTimeRecords.allTime.mostPointsWeek.value)} unit="pts" holder={allTimeRecords.allTime.mostPointsWeek.holder} detail={`Week ${allTimeRecords.allTime.mostPointsWeek.week}, ${allTimeRecords.allTime.mostPointsWeek.season}`} tone="peak" />
          <RecordCard title="Lowest Weekly Score" value={String(allTimeRecords.allTime.fewestPointsWeek.value)} unit="pts" holder={allTimeRecords.allTime.fewestPointsWeek.holder} detail={`Week ${allTimeRecords.allTime.fewestPointsWeek.week}, ${allTimeRecords.allTime.fewestPointsWeek.season}`} tone="low" />
          <RecordCard title="Highest Playoff Score" value={String(allTimeRecords.allTime.highestPlayoffScore?.value || 0)} unit="pts" holder={allTimeRecords.allTime.highestPlayoffScore?.holder || ""} detail={`Week ${allTimeRecords.allTime.highestPlayoffScore?.week || ""}, ${allTimeRecords.allTime.highestPlayoffScore?.season || ""}`} tone="peak" />
          <RecordCard title="Best Season Total" value={allTimeRecords.allTime.mostPointsSeason.value.toLocaleString()} unit="pts" holder={allTimeRecords.allTime.mostPointsSeason.holder} detail={`${allTimeRecords.allTime.mostPointsSeason.season} (${allTimeRecords.allTime.mostPointsSeason.games} games)`} tone="peak" />
          <RecordCard title="Best Record" value={allTimeRecords.allTime.bestRecord.value} holder={allTimeRecords.allTime.bestRecord.holder} detail={String(allTimeRecords.allTime.bestRecord.season)} tone="peak" />
          <RecordCard title="Worst Record" value={allTimeRecords.allTime.worstRecord.value} holder={allTimeRecords.allTime.worstRecord.holder} detail={String(allTimeRecords.allTime.worstRecord.season)} tone="low" />
          <RecordCard title="Longest Win Streak" value={String(allTimeRecords.allTime.longestWinStreak.value)} unit="wins" holder={allTimeRecords.allTime.longestWinStreak.holder} detail={String(allTimeRecords.allTime.longestWinStreak.season)} tone="peak" />
          <RecordCard title="Longest Losing Streak" value={String(allTimeRecords.allTime.longestLosingStreak.value)} unit="losses" holder={allTimeRecords.allTime.longestLosingStreak.holder} detail={String(allTimeRecords.allTime.longestLosingStreak.season)} tone="low" />
          <RecordCard title="Biggest Blowout" value={String(allTimeRecords.allTime.biggestBlowout.margin)} unit="pts" holder={`${allTimeRecords.allTime.biggestBlowout.winner} over ${allTimeRecords.allTime.biggestBlowout.loser}`} detail={`${allTimeRecords.allTime.biggestBlowout.score}, Week ${allTimeRecords.allTime.biggestBlowout.week}, ${allTimeRecords.allTime.biggestBlowout.season}`} tone="margin" />
          <RecordCard title="Closest Game" value={String(allTimeRecords.allTime.closestGame.margin)} unit="pts" holder={`${allTimeRecords.allTime.closestGame.winner} over ${allTimeRecords.allTime.closestGame.loser}`} detail={`${allTimeRecords.allTime.closestGame.score}, Week ${allTimeRecords.allTime.closestGame.week}, ${allTimeRecords.allTime.closestGame.season}`} tone="margin" />
        </div>
      </Container>

      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="Top 10 Weekly Scores" description="Highest single-week performances in league history" />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {allTimeRecords.leaderboards.top10WeeklyScores.map((s, i) => (
                  <div key={`${s.season}-${s.week}-${s.manager}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-xs font-bold ${weeklyScoreRanks[i] <= 3 ? "bg-ink text-white" : "bg-paper text-ink-muted"}`}>{weeklyScoreRanks[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-ink"><Link href={`/managers/${getManagerSlug(s.manager)}`} className="font-semibold hover:text-result">{s.manager}</Link></p>
                      <p className="text-xs text-ink-muted">vs {s.opponent} · Week {s.week}, {s.season}</p>
                    </div>
                    <span className="font-[family-name:var(--wire-display)] text-lg font-bold tabular-nums text-ink">{s.points}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Bottom 10 Weekly Scores" description="The weeks managers would rather forget" />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {allTimeRecords.leaderboards.bottom10WeeklyScores.map((s, i) => (
                  <div key={`${s.season}-${s.week}-${s.manager}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-xs font-bold ${bottomScoreRanks[i] <= 3 ? "bg-ink text-white" : "bg-paper text-ink-muted"}`}>{bottomScoreRanks[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-ink"><Link href={`/managers/${getManagerSlug(s.manager)}`} className="font-semibold hover:text-result">{s.manager}</Link></p>
                      <p className="text-xs text-ink-muted">vs {s.opponent} · Week {s.week}, {s.season}</p>
                    </div>
                    <span className="font-[family-name:var(--wire-display)] text-lg font-bold tabular-nums text-ink">{s.points}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="Biggest Blowouts" description="Largest margins of victory in a single matchup" />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {allTimeRecords.leaderboards.top10Blowouts.map((s, i) => (
                  <div key={`${s.season}-${s.week}-${s.winner}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-xs font-bold ${blowoutRanks[i] <= 3 ? "bg-ink text-white" : "bg-paper text-ink-muted"}`}>{blowoutRanks[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-ink"><span className="font-semibold">{s.winner}</span><span className="text-ink-muted"> over </span><span className="font-semibold">{s.loser}</span></p>
                      <p className="text-xs text-ink-muted">{s.score} · Week {s.week}, {s.season}</p>
                    </div>
                    <span className="font-[family-name:var(--wire-display)] text-lg font-bold tabular-nums text-ink">+{s.margin}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Closest Games" description="Nail-biters decided by the smallest margins" />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {allTimeRecords.leaderboards.top10ClosestGames.map((s, i) => (
                  <div key={`${s.season}-${s.week}-${s.winner}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-xs font-bold ${closestRanks[i] <= 3 ? "bg-ink text-white" : "bg-paper text-ink-muted"}`}>{closestRanks[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-ink"><span className="font-semibold">{s.winner}</span><span className="text-ink-muted"> over </span><span className="font-semibold">{s.loser}</span></p>
                      <p className="text-xs text-ink-muted">{s.score} · Week {s.week}, {s.season}</p>
                    </div>
                    <span className="font-[family-name:var(--wire-display)] text-lg font-bold tabular-nums text-ink">+{s.margin}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="Top Season Point Totals" description="Highest regular-season scoring outputs" />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {allTimeRecords.leaderboards.topSeasonPointTotals.map((s, i) => (
                  <div key={`${s.season}-${s.manager}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-xs font-bold ${seasonPtsRanks[i] <= 3 ? "bg-ink text-white" : "bg-paper text-ink-muted"}`}>{seasonPtsRanks[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-ink"><Link href={`/managers/${getManagerSlug(s.manager)}`} className="font-semibold hover:text-result">{s.manager}</Link><span className="text-ink-muted text-sm"> ({s.team})</span></p>
                      <p className="text-xs text-ink-muted">{s.season} · {s.games} games</p>
                    </div>
                    <span className="font-[family-name:var(--wire-display)] text-lg font-bold tabular-nums text-ink">{s.points.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Career Scoring Average" description="Average points per regular-season game (min. 10 games)" />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {allTimeRecords.leaderboards.avgPointsPerManager.map((s, i) => {
                  const maxAvg = allTimeRecords.leaderboards.avgPointsPerManager[0]?.avgPoints || 200;
                  const pct = Math.min(100, (s.avgPoints / maxAvg) * 100);
                  return (
                    <Link key={s.manager} href={`/managers/${getManagerSlug(s.manager)}`} className="block px-5 py-2.5 hover:bg-paper transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-[10px] font-bold ${avgPtsRanks[i] <= 3 ? "bg-ink text-white" : "bg-paper text-ink-muted"}`}>{avgPtsRanks[i]}</span>
                          <span className="font-semibold text-ink">{s.manager}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-sm text-ink">{s.avgPoints}</span>
                          <span className="text-xs text-ink-faint ml-1">({s.games}g)</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden bg-paper">
                        <div className="h-full bg-result" style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="Dynasty Rankings" description="Most top-3 finishes all time" />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {top3List.slice(0, 10).map(([name, count], i) => {
                  const titles = r.champCounts[name] || 0;
                  return (
                    <Link key={name} href={`/managers/${getManagerSlug(name)}`} className="flex items-center gap-3 px-5 py-3 hover:bg-paper transition-colors">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-sm font-bold ${top3Ranks[i] <= 3 ? "bg-ink text-white" : "bg-paper text-ink-muted"}`}>{top3Ranks[i]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ink">{name}</p>
                        <p className="text-xs text-ink-muted">{titles} title{titles !== 1 ? "s" : ""}, {count} podium{count !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: count }).map((_, j) => (
                          <div key={j} className={`h-2.5 w-2.5 ${j < titles ? "bg-result" : "bg-result/30"}`} />
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
              <div className="divide-y divide-rule">
                {r.ironmen.slice(0, 10).map((im, i) => (
                  <Link key={im.name} href={`/managers/${getManagerSlug(im.name)}`} className="flex items-center gap-3 px-5 py-3 hover:bg-paper transition-colors">
                    <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-sm font-bold ${ironmenRanks[i] <= 3 ? "bg-ink text-white" : "bg-paper text-ink-muted"}`}>{ironmenRanks[i]}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-ink">{im.name}</p>
                      <p className="text-xs text-ink-muted">{im.first} to {im.last}</p>
                    </div>
                    <span className="font-[family-name:var(--wire-display)] text-lg font-bold tabular-nums text-ink">{im.consecutive}</span>
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {r.bridesmaids.length > 0 && (
        <Container className="pt-0">
          <Card className="overflow-hidden" variant="chalkboard">
            <CardHeader title="Bridesmaid Award" description="Most runner-up finishes without ever winning the title" variant="chalkboard" />
            <CardBody variant="chalkboard">
              <div className="flex flex-wrap gap-4">
                {r.bridesmaids.map(([name, count]) => (
                  <Link key={name} href={`/managers/${getManagerSlug(name)}`} className="flex items-center gap-3 bg-record/5 border border-record/20 px-4 py-3 hover:bg-record/10 transition-colors">
                    {/* The count is the marker. A manager with two seconds and
                        no title gets a bigger number, which is the whole joke. */}
                    <span className="font-[family-name:var(--wire-display)] text-3xl font-extrabold leading-none tabular-nums text-record">
                      {count}
                    </span>
                    <div>
                      <p className="font-[family-name:var(--font-heading)] font-bold text-ink uppercase">{name}</p>
                      <p className="text-xs text-record">{count === 1 ? "runner-up finish" : "runner-up finishes"}, no title</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>
        </Container>
      )}

      <Container className="pt-0">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-wide text-ink mb-6">Draft Records</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="Most Loyal Drafters" description="Same manager drafting the same player across seasons" />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {r.loyaltyRecords.map((lr, i) => (
                  <div key={`${lr.manager}-${lr.player}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-xs font-bold ${loyaltyRanks[i] <= 3 ? "bg-ink text-white" : "bg-paper text-ink-muted"}`}>{loyaltyRanks[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-ink"><span className="font-semibold">{lr.manager}</span><span className="text-ink-muted"> drafted </span><span className="font-semibold">{lr.player}</span></p>
                      <span className={`border px-1.5 py-0 text-[9px] font-bold ${POS_COLORS[lr.pos] || "bg-paper text-ink-soft border-rule"}`}>{lr.pos}</span>
                    </div>
                    <span className="font-[family-name:var(--wire-display)] text-lg font-bold tabular-nums text-ink">{lr.count}x</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Most Drafted Players" description="Players taken most times across all league drafts" />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {mostDraftedSlice.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-xs font-bold ${mostDraftedRanks[i] <= 3 ? "bg-ink text-white" : "bg-paper text-ink-muted"}`}>{mostDraftedRanks[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold text-ink">{p.name}</p>
                      <p className="text-xs text-ink-muted">{p.nflTeam}</p>
                    </div>
                    <span className={`border px-2 py-0.5 text-[10px] font-bold ${POS_COLORS[p.pos] || "bg-paper text-ink-soft border-rule"}`}>{p.pos}</span>
                    <span className="font-[family-name:var(--wire-display)] text-lg font-bold tabular-nums text-ink">{p.count}x</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="#1 Overall Picks" description="Every first pick in league history" />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {r.firstOveralls.map((fo) => (
                  <div key={fo.year} className="flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors">
                    <span className="font-[family-name:var(--wire-mono)] text-lg font-bold tabular-nums text-ink w-12">{fo.year}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink">{fo.player}</p>
                      <p className="text-xs text-ink-muted">{fo.pos} · {fo.nflTeam}</p>
                    </div>
                    <Link href={`/managers/${getManagerSlug(fo.manager)}`} className="text-sm text-ink-muted hover:text-result">{fo.manager}</Link>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="QB Timer" description="Average round of first QB pick (earliest to latest)" />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {r.qbTimers.map((qt) => {
                  const maxAvg = r.qbTimers[r.qbTimers.length - 1]?.avg || 16;
                  const pct = Math.min(100, (qt.avg / maxAvg) * 100);
                  return (
                    <Link key={qt.name} href={`/managers/${getManagerSlug(qt.name)}`} className="block px-5 py-2.5 hover:bg-paper transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-ink text-sm">{qt.name}</span>
                        <span className="font-mono text-sm text-ink-soft">R{qt.avg.toFixed(1)}</span>
                      </div>
                      {/* The bar length already says how long a manager waits.
                          Banding it rose / sky / grey added a second encoding of
                          the same number in colours that carry no order. */}
                      <div className="h-1.5 w-full overflow-hidden bg-paper">
                        <div className="h-full bg-ink-soft" style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="Most Drafted NFL Teams" description="Total picks from each NFL franchise across all drafts" />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {r.topNflTeams.map(([team, count], i) => {
                  const maxCount = r.topNflTeams[0]?.[1] || 1;
                  const pct = (count / maxCount) * 100;
                  return (
                    <div key={team} className="px-5 py-2.5 hover:bg-paper transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-[10px] font-bold ${nflTeamRanks[i] <= 3 ? "bg-ink text-white" : "bg-paper text-ink-muted"}`}>{nflTeamRanks[i]}</span>
                          <span className="font-semibold text-ink">{team}</span>
                        </div>
                        <span className="font-mono text-sm text-ink-muted">{count} picks</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden bg-paper">
                        <div className="h-full bg-result" style={{ width: `${pct}%` }} />
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
                  <thead className="text-[10px] uppercase tracking-wider text-ink-muted border-b-2 border-ink">
                    <tr>
                      <th className="px-3 py-2 text-left">Year</th>
                      <th className="px-3 py-2 text-center">RB</th>
                      <th className="px-3 py-2 text-center">WR</th>
                      <th className="px-3 py-2 text-center">QB</th>
                      <th className="px-3 py-2 text-center">TE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {r.r1ByYear.map((yr) => (
                      <tr key={yr.year} className="hover:bg-paper transition-colors">
                        <td className="px-3 py-2 font-[family-name:var(--wire-mono)] font-bold tabular-nums text-ink">{yr.year}</td>
                        {(["RB", "WR", "QB", "TE"] as const).map((pos) => {
                          const n = yr.positions[pos] || 0;
                          return (
                            <td key={pos} className="px-3 py-2 text-center font-[family-name:var(--wire-display)] text-base tabular-nums">
                              <span className={n === 0 ? "text-ink-faint" : n >= 4 ? "font-extrabold text-ink" : "font-bold text-ink-soft"}>{n}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      <Container className="pt-0">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-wide text-ink mb-6">Keeper Records</h2>
        <p className="mb-6 text-sm text-ink-muted">
          {r.totalKeepers} keepers across 10 seasons. Early years (2016-2022): keepers slotted into the final rounds (14-16).
          Since 2023: keepers held at their original draft round.
        </p>

        <div className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
          <StatCard label="Total Keepers" value={r.totalKeepers.toString()} />
          <StatCard label="Avg / Draft" value={r.keepersByYear.length > 1 ? Math.round(r.totalKeepers / (r.keepersByYear.length - 1)).toString() : "0"} />
          <StatCard label="Longest Streak" value={r.keeperStreaks[0]?.streak.toString() || "0"} />
          <StatCard label="Seasons Tracked" value={(r.keepersByYear.length - 1).toString()} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="Longest Keeper Streaks" description="Same manager, same player, most consecutive seasons" />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {keeperStreakSlice.map((ks, i) => (
                  <div key={`${ks.manager}-${ks.player}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-xs font-bold ${keeperStreakRanks[i] <= 3 ? "bg-ink text-white" : "bg-paper text-ink-muted"}`}>{keeperStreakRanks[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-ink"><Link href={`/managers/${getManagerSlug(ks.manager)}`} className="font-semibold hover:text-result">{ks.manager}</Link><span className="text-ink-muted"> kept </span><span className="font-semibold">{ks.player}</span></p>
                      <p className="text-xs text-ink-muted">{ks.years[0]} to {ks.years[ks.years.length - 1]}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-[family-name:var(--wire-display)] text-lg font-bold tabular-nums text-ink">{ks.streak}</span>
                      <span className="text-xs text-ink-faint ml-1">yrs</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Keeper Volume" description="Total keeper picks per manager (all time)" />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {topKeeperSlice.map(([name, count], i) => {
                  const maxCount = topKeeperSlice[0]?.[1] || 1;
                  const pct = (count / maxCount) * 100;
                  return (
                    <Link key={name} href={`/managers/${getManagerSlug(name)}`} className="block px-5 py-2.5 hover:bg-paper transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center font-[family-name:var(--font-heading)] text-[10px] font-bold ${topKeeperRanks[i] <= 3 ? "bg-ink text-white" : "bg-paper text-ink-muted"}`}>{topKeeperRanks[i]}</span>
                          <span className="font-semibold text-ink">{name}</span>
                        </div>
                        <span className="font-mono text-sm text-ink-muted">{count} keepers</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden bg-paper">
                        <div className="h-full bg-result" style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="mt-6">
          <Card className="overflow-hidden">
            <CardHeader title="Keepers by Season" description="How many players were kept each year" />
            <CardBody>
              <div className="flex items-end gap-2 h-32">
                {r.keepersByYear.map((ky) => {
                  const heightPct = Math.max(4, (ky.keepers / 50) * 100);
                  return (
                    <div key={ky.year} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-mono text-ink-muted">{ky.keepers}</span>
                      <div className="w-full bg-result" style={{ height: `${heightPct}%` }} />
                      <span className="text-[9px] text-ink-faint">{String(ky.year).slice(2)}</span>
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
