import Link from "next/link";
import { Suspense } from "react";
import StandingsPreview from "@/components/home/StandingsPreview";
import ScoreboardPreview from "@/components/home/ScoreboardPreview";
import SeasonAtAGlance from "@/components/home/SeasonAtAGlance";
import PullToRefresh from "@/components/PullToRefresh";
import { fetchSettings } from "@/lib/server-data";
import membersData from "@/data/members.json";
import historyData from "@/data/history.json";
import allTimeRecords from "@/data/all-time-records.json";
import { PAYOUTS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const members = membersData as {
  active: { name: string; teamName: string }[];
  emeritus: { name: string; teamName: string }[];
};
const history = historyData as {
  seasons: {
    year: number;
    champion?: string;
    championTeam?: string;
    runnerUp?: string;
    runnerUpTeam?: string;
    third?: string;
    thirdTeam?: string;
  }[];
};
const totalMatchups = (allTimeRecords as { totalMatchups: number }).totalMatchups;

/**
 * Every headline on this page is derived, never typed in. The league's defining
 * fact is that eleven seasons have produced eleven different champions, and that
 * only stays true if it is recomputed rather than asserted.
 */
function getChampionStats() {
  const titles: Record<string, number> = {};
  const top3: Record<string, number> = {};
  for (const s of history.seasons) {
    if (s.champion) {
      titles[s.champion] = (titles[s.champion] || 0) + 1;
      top3[s.champion] = (top3[s.champion] || 0) + 1;
    }
    if (s.runnerUp) top3[s.runnerUp] = (top3[s.runnerUp] || 0) + 1;
    if (s.third) top3[s.third] = (top3[s.third] || 0) + 1;
  }
  const titleList = Object.entries(titles).sort((a, b) => b[1] - a[1]);
  const top3List = Object.entries(top3).sort((a, b) => b[1] - a[1]);
  const mostTitles = titleList.length ? titleList[0][1] : 0;
  return {
    titles,
    titleList,
    top3List,
    uniqueChamps: titleList.length,
    everRepeated: mostTitles > 1,
  };
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.16em] text-result">
      {children}
    </p>
  );
}

function RailHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 border-b-2 border-ink pb-1 font-[family-name:var(--wire-display)] text-[13px] font-extrabold uppercase tracking-[0.1em] text-ink">
      {children}
    </h2>
  );
}

function PreviewSkeleton({ lines = 5 }: { lines?: number }) {
  return (
    <div className="border border-rule bg-surface p-4">
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-9 animate-pulse bg-rule" />
        ))}
      </div>
    </div>
  );
}

/** The four figures that describe the league without needing a live API. */
function ByTheNumbers() {
  const stats = getChampionStats();
  const oldest = history.seasons[history.seasons.length - 1]?.year;
  const newest = history.seasons[0]?.year;

  const rows: [string, string, string][] = [
    ["Seasons", String(history.seasons.length), `${oldest}–${newest}`],
    [
      "Champions",
      String(stats.uniqueChamps),
      stats.everRepeated ? "Repeat winners" : "All different",
    ],
    ["The pot", `$${PAYOUTS.totalPot.toLocaleString("en-US")}`, `$${PAYOUTS.buyIn} a head`],
    [
      "Managers",
      String(members.active.length),
      `${members.emeritus.length} departed`,
    ],
  ];

  return (
    <dl className="border-t border-rule">
      {rows.map(([label, value, note]) => (
        <div
          key={label}
          className="flex items-baseline justify-between gap-3 border-b border-rule py-2.5"
        >
          <dt className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            {label}
          </dt>
          <dd className="text-right">
            <span className="font-[family-name:var(--wire-display)] text-[22px] font-extrabold leading-none text-ink">
              {value}
            </span>
            <span className="ml-2 font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.1em] text-ink-faint">
              {note}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The pot, split the way the commissioner actually splits it. */
function PotBreakdown() {
  return (
    <div className="border border-rule bg-surface p-4">
      <p className="font-[family-name:var(--wire-display)] text-[30px] font-extrabold leading-none text-ink">
        ${PAYOUTS.totalPot.toLocaleString("en-US")}
      </p>
      <p className="mt-1 font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.1em] text-ink-muted">
        ${PAYOUTS.buyIn} × {PAYOUTS.teams} managers
      </p>
      <dl className="mt-3 border-t border-rule pt-3 text-[13px]">
        <div className="flex justify-between border-b border-rule pb-2">
          <dt className="text-ink-muted">
            Weekly · {PAYOUTS.weeklyWeeks} × ${PAYOUTS.weeklyPerWeek}
          </dt>
          <dd className="font-mono text-ink">
            ${PAYOUTS.weeklyPool.toLocaleString("en-US")}
          </dd>
        </div>
        <div className="flex justify-between pt-2">
          <dt className="text-ink-muted">Year end</dt>
          <dd className="font-mono text-ink">
            ${PAYOUTS.yearEndPool.toLocaleString("en-US")}
          </dd>
        </div>
      </dl>
      <Link
        href="/payouts"
        className="mt-3 inline-block font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.1em] text-result hover:underline"
      >
        Full payout structure
      </Link>
    </div>
  );
}

/** Champions, newest first. The year is the anchor, so it leads each row. */
function ChampionLedger({ limit = 6 }: { limit?: number }) {
  return (
    <div className="border-t border-rule">
      {history.seasons.slice(0, limit).map((s) => (
        <div
          key={s.year}
          className="flex items-baseline gap-3 border-b border-rule py-2.5"
        >
          <span className="w-10 flex-shrink-0 font-[family-name:var(--wire-mono)] text-[11px] tracking-[0.06em] text-ink-muted">
            {s.year}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-[family-name:var(--wire-display)] text-[15px] font-bold uppercase tracking-[0.02em] text-ink">
              {s.champion}
            </p>
            <p className="truncate text-[12px] text-ink-muted">
              {s.championTeam}
            </p>
          </div>
        </div>
      ))}
      <Link
        href="/history"
        className="mt-3 inline-block font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.1em] text-result hover:underline"
      >
        Every season since {history.seasons[history.seasons.length - 1]?.year}
      </Link>
    </div>
  );
}

/** Most top-three finishes. Titles are filled squares, podiums hollow ones. */
function NearlyMen() {
  const stats = getChampionStats();
  return (
    <div className="border-t border-rule">
      {stats.top3List.slice(0, 6).map(([name, count]) => {
        const titleCount = stats.titles[name] || 0;
        return (
          <div
            key={name}
            className="flex items-center gap-3 border-b border-rule py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-[family-name:var(--wire-display)] text-[14px] font-bold uppercase tracking-[0.02em] text-ink">
                {name}
              </p>
              <p className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.1em] text-ink-muted">
                {titleCount} {titleCount === 1 ? "title" : "titles"} · {count}{" "}
                top three
              </p>
            </div>
            <div className="flex flex-shrink-0 gap-0.5">
              {Array.from({ length: count }).map((_, j) => (
                <div
                  key={j}
                  className={`h-2.5 w-2.5 ${
                    j < titleCount
                      ? "bg-result"
                      : "border border-ink-faint bg-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function Home() {
  const settingsResult = await fetchSettings();
  // Any failed settings call used to print "Between seasons", so a Yahoo outage
  // in week two told the front page it was February. Only say it when the
  // classifier actually found an offseason.
  const isOffseason = !settingsResult.ok && settingsResult.offseason;
  const stats = getChampionStats();
  const defending = history.seasons[0];

  return (
    <PullToRefresh>
      {/* Lead story. The strongest true fact in the data is that nobody has ever
          won it twice, so that is the headline rather than a welcome message. */}
      <section className="border-b-2 border-ink bg-surface">
        <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6 lg:py-9">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:gap-10">
            <div className="min-w-0">
              {/* The kicker dates the story rather than repeating it. It used
                  to read "11 seasons" directly above a headline that also says
                  "11 seasons", so it told the reader nothing new. */}
              <Kicker>
                {isOffseason ? "Between seasons" : "The league"} ·{" "}
                {defending?.year ? `${defending.year} final` : "Est. 2015"}
              </Kicker>
              <h1 className="mt-2 font-[family-name:var(--wire-display)] text-[44px] font-extrabold uppercase leading-[0.92] tracking-[0.01em] text-ink sm:text-[60px] lg:text-[72px]">
                {stats.everRepeated ? (
                  <>Eleven seasons, and a dynasty at last</>
                ) : (
                  <>
                    {history.seasons.length} seasons.
                    <br />
                    {stats.uniqueChamps} different champions.
                  </>
                )}
              </h1>
              <p className="mt-4 max-w-[64ch] font-[family-name:var(--wire-body)] text-[17px] leading-[1.55] text-ink-soft">
                {stats.everRepeated
                  ? "Someone has finally gone back to back."
                  : `Nobody has ever won this thing twice. ${totalMatchups.toLocaleString("en-US")} matchups since ${history.seasons[history.seasons.length - 1]?.year} and the trophy has gone to a different manager every single year.`}
              </p>

              {defending?.champion && (
                <div className="mt-6 border-t-2 border-ink pt-4">
                  <p className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                    Defending champion · {defending.year}
                  </p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-[family-name:var(--wire-display)] text-[30px] font-extrabold uppercase leading-none text-result">
                      {defending.champion}
                    </span>
                    <span className="font-[family-name:var(--wire-body)] text-[15px] text-ink-muted">
                      {defending.championTeam}
                    </span>
                  </div>
                  <p className="mt-1 font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                    Beat {defending.runnerUp} · {defending.third} third
                  </p>
                </div>
              )}
            </div>

            <aside className="min-w-0">
              <RailHeading>By the numbers</RailHeading>
              <ByTheNumbers />
            </aside>
          </div>
        </div>
      </section>

      {/* Body: live sections in the main column, standing data in the rail. */}
      <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6 lg:py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:gap-10">
          {/* The live sections carry their own headers, so they are not wrapped
              in a rail heading: doing so printed the title twice, and left a
              stranded rule when a section had no data to show. */}
          <main className="min-w-0 space-y-8">
            <Suspense fallback={<PreviewSkeleton lines={2} />}>
              <SeasonAtAGlance />
            </Suspense>

            <Suspense fallback={<PreviewSkeleton />}>
              <ScoreboardPreview />
            </Suspense>

            <Suspense fallback={<PreviewSkeleton />}>
              <StandingsPreview />
            </Suspense>

            <section>
              <RailHeading>Most top-three finishes</RailHeading>
              <NearlyMen />
            </section>
          </main>

          <aside className="min-w-0 space-y-8">
            <section>
              <RailHeading>Champions</RailHeading>
              <ChampionLedger />
            </section>

            <section>
              <RailHeading>The pot</RailHeading>
              <PotBreakdown />
            </section>

            <section>
              <RailHeading>The rule</RailHeading>
              <p className="border-l-2 border-result pl-3 font-[family-name:var(--wire-body)] text-[15px] leading-[1.5] text-ink-soft">
                Failure to set your lineup is your own fault.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </PullToRefresh>
  );
}
