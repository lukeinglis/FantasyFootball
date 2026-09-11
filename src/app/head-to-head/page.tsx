import type { Metadata } from "next";
import Link from "next/link";
import { getManagerSlug } from "@/lib/managers";
import { computeHeadToHead, getAllManagers } from "@/lib/head-to-head";
import type { Rivalry } from "@/lib/head-to-head";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardHeader, CardBody } from "@/components/Card";

export const metadata: Metadata = {
  title: "Head-to-Head Records",
  description:
    "All-time head-to-head matchup records between every manager in Greybushes & Chili Dogs.",
};

function findRivalry(
  rivalries: Rivalry[],
  a: string,
  b: string,
): Rivalry | undefined {
  const [s1, s2] = [a, b].sort();
  return rivalries.find((r) => r.manager1 === s1 && r.manager2 === s2);
}

function getCellRecord(
  rivalry: Rivalry,
  manager: string,
): { wins: number; losses: number; games: number } {
  const isM1 = manager === rivalry.manager1;
  const rsW = rivalry.regularSeason.wins;
  const rsL = rivalry.regularSeason.losses;
  const pW = rivalry.playoffs.wins;
  const pL = rivalry.playoffs.losses;
  const totalW = rsW + pW;
  const totalL = rsL + pL;
  return {
    wins: isM1 ? totalW : totalL,
    losses: isM1 ? totalL : totalW,
    games: rivalry.totalGames,
  };
}

export default function HeadToHeadPage() {
  const rivalries = computeHeadToHead();
  const managers = getAllManagers(rivalries);
  const totalGames = rivalries.reduce((s, r) => s + r.totalGames, 0);

  const topRivalries = [...rivalries]
    .sort((a, b) => b.totalGames - a.totalGames)
    .slice(0, 10);

  const mostLopsided = [...rivalries]
    .filter((r) => r.totalGames >= 3)
    .sort((a, b) => {
      const aRatio = Math.max(
        a.regularSeason.wins + a.playoffs.wins,
        a.regularSeason.losses + a.playoffs.losses,
      ) / Math.max(1, a.totalGames);
      const bRatio = Math.max(
        b.regularSeason.wins + b.playoffs.wins,
        b.regularSeason.losses + b.playoffs.losses,
      ) / Math.max(1, b.totalGames);
      return bRatio - aRatio;
    })
    .slice(0, 10);

  return (
    <>
      <PageHeader
        eyebrow="Rivalries"
        title="Head-to-Head"
        /* This count is lower than the 1,042 quoted elsewhere on the site
           because consolation games are excluded here. Saying so up front
           stops the two figures reading as a bug. */
        subtitle={`${managers.length} managers and ${totalGames.toLocaleString()} matchups, consolation games excluded. Every rivalry, every record.`}
      />

      {/* Stats Banner */}
      <Container>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <StatCard label="Total Matchups" value={totalGames.toLocaleString()} />
          <StatCard label="Managers" value={String(managers.length)} />
          <StatCard label="Rivalries" value={String(rivalries.length)} />
          <StatCard
            label="Longest Rivalry"
            value={
              topRivalries[0]
                ? `${topRivalries[0].totalGames} games`
                : "None yet"
            }
          />
        </div>
      </Container>

      {/* Rivalry Matrix */}
      <Container className="pt-0">
        <Card className="overflow-hidden">
          <CardHeader
            title="Rivalry Matrix"
            description="All-time W-L record from row manager's perspective (regular season + playoffs, excludes consolation)"
          />
          <CardBody className="!p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface text-[10px] uppercase tracking-wider text-ink-muted">
                  <tr>
                    <th className="sticky left-0 z-10 bg-surface px-3 py-2 text-left min-w-[100px]">
                      Manager
                    </th>
                    {managers.map((m) => (
                      <th
                        key={m}
                        className="px-2 py-2 text-center min-w-[60px]"
                      >
                        <span className="block truncate max-w-[60px]">
                          {m}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {managers.map((rowMgr) => (
                    <tr
                      key={rowMgr}
                      className="hover:bg-paper transition-colors"
                    >
                      <td className="sticky left-0 z-10 bg-surface px-3 py-2 font-semibold text-ink border-r border-rule">
                        <Link
                          href={`/managers/${getManagerSlug(rowMgr)}`}
                          className="hover:text-result transition-colors"
                        >
                          {rowMgr}
                        </Link>
                      </td>
                      {managers.map((colMgr) => {
                        if (rowMgr === colMgr) {
                          return (
                            <td
                              key={colMgr}
                              className="px-2 py-2 text-center bg-paper"
                            >
                              <span className="text-ink-muted">&mdash;</span>
                            </td>
                          );
                        }
                        const rivalry = findRivalry(
                          rivalries,
                          rowMgr,
                          colMgr,
                        );
                        if (!rivalry) {
                          return (
                            <td
                              key={colMgr}
                              className="px-2 py-2 text-center text-ink-muted"
                            >
                              &ndash;
                            </td>
                          );
                        }
                        const { wins, losses } = getCellRecord(
                          rivalry,
                          rowMgr,
                        );
                        const isWinning = wins > losses;
                        const isLosing = losses > wins;
                        return (
                          <td
                            key={colMgr}
                            className={`px-2 py-2 text-center font-mono ${
 isWinning
                                ? "text-record font-bold"
                                : isLosing
                                  ? "text-result"
                                  : "text-ink-muted"
                            }`}
                          >
                            {wins}-{losses}
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
      </Container>

      {/* Top Rivalries + Most Lopsided */}
      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Most Played */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Most Played Rivalries"
              description="The matchups that keep coming back"
            />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {topRivalries.map((r) => {
                  const { wins, losses } = getCellRecord(r, r.manager1);
                  return (
                    <div
                      key={`${r.manager1}-${r.manager2}`}
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors"
                    >
                      {/* A games-played count, already ranked by its position in
                          the list. Red made every row look like a result. */}
                      <span className="w-8 text-center font-[family-name:var(--wire-display)] text-lg font-bold tabular-nums text-ink">
                        {r.totalGames}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-ink">
                          <Link
                            href={`/managers/${getManagerSlug(r.manager1)}`}
                            className="font-semibold hover:text-result"
                          >
                            {r.manager1}
                          </Link>
                          <span className="text-ink-muted"> vs </span>
                          <Link
                            href={`/managers/${getManagerSlug(r.manager2)}`}
                            className="font-semibold hover:text-result"
                          >
                            {r.manager2}
                          </Link>
                        </p>
                        <p className="text-xs text-ink-muted">
                          {wins}-{losses} (from {r.manager1}&apos;s side)
                          {r.currentStreak &&
                            r.currentStreak.count >= 2 &&
                            ` · ${r.currentStreak.manager} on ${r.currentStreak.count}-game streak`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Most Lopsided */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Most Lopsided Rivalries"
              description="Dominance in head-to-head (min. 3 games)"
            />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {mostLopsided.map((r) => {
                  const { wins, losses } = getCellRecord(r, r.manager1);
                  const dominant =
                    wins >= losses ? r.manager1 : r.manager2;
                  const dominated =
                    wins >= losses ? r.manager2 : r.manager1;
                  const domW = Math.max(wins, losses);
                  const domL = Math.min(wins, losses);
                  const pct =
                    r.totalGames > 0
                      ? Math.round((domW / r.totalGames) * 100)
                      : 0;
                  return (
                    <div
                      key={`${r.manager1}-${r.manager2}`}
                      className="px-5 py-2.5 hover:bg-paper transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-ink text-sm">
                          <Link
                            href={`/managers/${getManagerSlug(dominant)}`}
                            className="font-semibold hover:text-result"
                          >
                            {dominant}
                          </Link>
                          <span className="text-ink-muted"> over </span>
                          <Link
                            href={`/managers/${getManagerSlug(dominated)}`}
                            className="font-semibold hover:text-result"
                          >
                            {dominated}
                          </Link>
                        </p>
                        <span className="font-mono text-sm tabular-nums text-ink">
                          {domW}-{domL}
                        </span>
                      </div>
                      {/* Win share, already given as a record two lines up and
                          as bar length here. A red bar on all nine rows was a
                          third encoding of the same fact. */}
                      <div className="h-1.5 w-full overflow-hidden bg-paper">
                        <div
                          className="h-full bg-ink-soft"
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

      {/* Notable Games */}
      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Biggest Blowouts in Rivalries */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Biggest Rivalry Blowouts"
              description="Largest margins in head-to-head matchups"
            />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {[...rivalries]
                  .filter((r) => r.regularSeason.biggestBlowout || r.playoffs.biggestBlowout)
                  .map((r) => {
                    const rs = r.regularSeason.biggestBlowout;
                    const po = r.playoffs.biggestBlowout;
                    const best =
                      rs && po
                        ? rs.margin >= po.margin
                          ? rs
                          : po
                        : rs || po;
                    return { rivalry: r, game: best! };
                  })
                  .sort((a, b) => b.game.margin - a.game.margin)
                  .slice(0, 8)
                  .map(({ rivalry, game }) => (
                    <div
                      key={`${rivalry.manager1}-${rivalry.manager2}-blowout`}
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-ink text-sm">
                          <span className="font-semibold">
                            {rivalry.manager1}
                          </span>
                          <span className="text-ink-muted"> vs </span>
                          <span className="font-semibold">
                            {rivalry.manager2}
                          </span>
                        </p>
                        <p className="text-xs text-ink-muted">
                          {game.winnerPoints}-{game.loserPoints} · Week{" "}
                          {game.week}, {game.year}
                        </p>
                      </div>
                      <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-result">
                        +{game.margin}
                      </span>
                    </div>
                  ))}
              </div>
            </CardBody>
          </Card>

          {/* Closest Rivalry Games */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Closest Rivalry Games"
              description="The nail-biters between rivals"
            />
            <CardBody className="!p-0">
              <div className="divide-y divide-rule">
                {[...rivalries]
                  .filter((r) => r.regularSeason.closestGame || r.playoffs.closestGame)
                  .map((r) => {
                    const rs = r.regularSeason.closestGame;
                    const po = r.playoffs.closestGame;
                    const best =
                      rs && po
                        ? rs.margin <= po.margin
                          ? rs
                          : po
                        : rs || po;
                    return { rivalry: r, game: best! };
                  })
                  .sort((a, b) => a.game.margin - b.game.margin)
                  .slice(0, 8)
                  .map(({ rivalry, game }) => (
                    <div
                      key={`${rivalry.manager1}-${rivalry.manager2}-close`}
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-paper transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-ink text-sm">
                          <span className="font-semibold">
                            {rivalry.manager1}
                          </span>
                          <span className="text-ink-muted"> vs </span>
                          <span className="font-semibold">
                            {rivalry.manager2}
                          </span>
                        </p>
                        <p className="text-xs text-ink-muted">
                          {game.winnerPoints}-{game.loserPoints} · Week{" "}
                          {game.week}, {game.year}
                        </p>
                      </div>
                      <span className="font-[family-name:var(--wire-display)] text-lg font-bold tabular-nums text-ink">
                        +{game.margin}
                      </span>
                    </div>
                  ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>
    </>
  );
}

// Four counts of the same kind. "Rivalries" carried a `highlight` that set it
// in gold, which claimed 66 mattered more than the 1,042 beside it.
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="scoreboard">
      <CardBody>
        <div className="text-center">
          <p className="font-[family-name:var(--wire-mono)] text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
            {label}
          </p>
          <p className="mt-1 font-[family-name:var(--wire-display)] text-3xl font-extrabold tabular-nums text-ink">
            {value}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
