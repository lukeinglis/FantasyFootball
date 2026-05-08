import Link from "next/link";
import { Suspense } from "react";
import Container from "@/components/Container";
import StandingsPreview from "@/components/home/StandingsPreview";
import ScoreboardPreview from "@/components/home/ScoreboardPreview";
import ArticlesPreview from "@/components/home/ArticlesPreview";
import SeasonAtAGlance from "@/components/home/SeasonAtAGlance";
import SeasonCountdown from "@/components/SeasonCountdown";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { fetchSettings } from "@/lib/server-data";
import membersData from "@/data/members.json";
import historyData from "@/data/history.json";
import { PAYOUTS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const members = membersData as { active: { name: string; teamName: string }[]; emeritus: { name: string; teamName: string }[] };
const history = historyData as { seasons: { year: number; champion?: string; championTeam?: string; runnerUp?: string; runnerUpTeam?: string; third?: string; thirdTeam?: string }[] };

function getChampionStats() {
  const titles: Record<string, number> = {};
  const top3: Record<string, number> = {};
  for (const s of history.seasons) {
    if (s.champion) { titles[s.champion] = (titles[s.champion] || 0) + 1; top3[s.champion] = (top3[s.champion] || 0) + 1; }
    if (s.runnerUp) { top3[s.runnerUp] = (top3[s.runnerUp] || 0) + 1; }
    if (s.third) { top3[s.third] = (top3[s.third] || 0) + 1; }
  }
  const titleList = Object.entries(titles).sort((a, b) => b[1] - a[1]);
  const top3List = Object.entries(top3).sort((a, b) => b[1] - a[1]);
  const uniqueChamps = titleList.length;
  return { titles, top3, titleList, top3List, uniqueChamps };
}

function PreviewSkeleton({ lines = 5 }: { lines?: number }) {
  return (
    <Card>
      <CardBody>
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-white/10" />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export default async function Home() {
  const settingsResult = await fetchSettings();
  const isOffseason = !settingsResult.ok;
  const season = settingsResult.ok ? settingsResult.data.season : null;
  const stats = getChampionStats();
  const defendingChamp = history.seasons[0];
  const recentSeasons = history.seasons.slice(0, 5);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#1a3a5c] via-[#112d4e] to-[#0a1c30]">
        <div className="stripe-pattern pointer-events-none absolute inset-0 opacity-80" aria-hidden />
        <div aria-hidden className="pointer-events-none absolute inset-0 dot-pattern opacity-[0.04]" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-full w-1/2"
          style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(221, 85, 12, 0.12), transparent 70%)" }}
        />
        <Container className="relative py-20 sm:py-24 lg:py-32">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="animate-fade-in-up">
              <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.3em] text-[#DD550C] sm:text-sm">
                {season ? `${season} Season` : `${history.seasons.length} Seasons Strong`}
              </p>
              <h1 className="mt-4 font-[family-name:var(--font-heading)] text-5xl font-extrabold uppercase tracking-tight text-white sm:text-6xl lg:text-7xl">
                Greybushes{" "}
                <span className="text-gradient">&amp;</span>{" "}
                Chili Dogs
              </h1>
              <p className="mt-4 max-w-2xl text-xl text-gray-300/90 sm:text-2xl">
                A bunch of degenerates who claim to be extraordinary swindlers.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/standings"
                  className="font-[family-name:var(--font-heading)] rounded-lg bg-[#DD550C] px-6 py-3 text-base font-bold uppercase tracking-wide text-white shadow-lg shadow-[#DD550C]/20 transition-all hover:bg-orange-500 hover:shadow-[#DD550C]/40"
                >
                  View Standings
                </Link>
                <Link
                  href="/history"
                  className="font-[family-name:var(--font-heading)] rounded-lg border border-[#DD550C]/40 px-6 py-3 text-base font-bold uppercase tracking-wide text-[#DD550C] transition-all hover:bg-[#DD550C]/10"
                >
                  Hall of Champions
                </Link>
                <Link
                  href="/wall-of-shame"
                  className="font-[family-name:var(--font-heading)] rounded-lg border border-white/15 px-6 py-3 text-base font-bold uppercase tracking-wide text-white transition-all hover:bg-white/5"
                >
                  Wall of Shame
                </Link>
              </div>
            </div>
            {isOffseason && (
              <div className="lg:w-96 flex-shrink-0 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                <SeasonCountdown />
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Defending Champion Banner */}
      {defendingChamp && (
        <Container>
          <div className="relative overflow-hidden rounded-2xl border border-[#DD550C]/30 bg-gradient-to-r from-[#DD550C]/10 via-[#112d4e] to-[#DD550C]/10 p-6 sm:p-8">
            <div className="stripe-pattern pointer-events-none absolute inset-0 opacity-30" aria-hidden />
            <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#DD550C] to-[#a33d08] text-3xl shadow-lg shadow-[#DD550C]/30">
                🏆
              </div>
              <div>
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-[#DD550C]">
                  {defendingChamp.year} Defending Champion
                </p>
                <p className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold uppercase text-white sm:text-3xl">
                  {defendingChamp.champion}
                </p>
                <p className="text-sm text-gray-400">
                  {defendingChamp.championTeam}
                </p>
              </div>
              <div className="hidden sm:block sm:ml-auto">
                <Link
                  href="/history"
                  className="font-[family-name:var(--font-heading)] rounded-lg border border-[#DD550C]/40 px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#DD550C] transition-all hover:bg-[#DD550C]/10"
                >
                  Full History
                </Link>
              </div>
            </div>
          </div>
        </Container>
      )}

      {/* Season summary */}
      <Container className="pt-0">
        <Suspense fallback={<PreviewSkeleton lines={2} />}>
          <SeasonAtAGlance />
        </Suspense>
      </Container>

      {/* League by the Numbers */}
      <Container className="pt-0">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card variant="glass">
            <CardBody>
              <div className="text-center">
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Seasons Played</p>
                <p className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-bold text-gradient">{history.seasons.length}</p>
                <p className="mt-1 text-sm text-gray-400">{history.seasons[history.seasons.length - 1]?.year} to {history.seasons[0]?.year}</p>
              </div>
            </CardBody>
          </Card>
          <Card variant="glass">
            <CardBody>
              <div className="text-center">
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Unique Champions</p>
                <p className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-bold text-gradient">{stats.uniqueChamps}</p>
                <p className="mt-1 text-sm text-gray-400">No repeat winners</p>
              </div>
            </CardBody>
          </Card>
          <Card variant="glass">
            <CardBody>
              <div className="text-center">
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">The Pot</p>
                <p className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-bold text-gradient">${PAYOUTS.totalPot.toLocaleString()}</p>
                <p className="mt-1 text-sm text-gray-400">${PAYOUTS.buyIn} buy-in / {members.active.length} managers</p>
              </div>
            </CardBody>
          </Card>
          <Card variant="glass">
            <CardBody>
              <div className="text-center">
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Active Managers</p>
                <p className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-bold text-gradient">{members.active.length}</p>
                <p className="mt-1 text-sm text-gray-400">Plus {members.emeritus.length} emeritus</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* Recent Champions + Dynasty Rankings side by side */}
      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Champions */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Recent Champions"
              action={<Link href="/history" className="text-xs font-medium text-[#DD550C] hover:underline">View all &rarr;</Link>}
            />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {recentSeasons.map((s, i) => (
                  <div key={s.year} className="flex items-center gap-4 px-5 py-3 hover:bg-white/5 transition-colors">
                    <span className="font-[family-name:var(--font-heading)] font-mono text-lg font-bold text-[#DD550C]">{s.year}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">
                        {i === 0 && <span className="mr-1.5">🏆</span>}
                        {s.champion}
                      </p>
                      <p className="truncate text-xs text-gray-400">{s.championTeam}</p>
                    </div>
                    <div className="hidden sm:block text-right text-xs text-gray-500">
                      <p>2nd: {s.runnerUp}</p>
                      <p>3rd: {s.third}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Dynasty Rankings */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Dynasty Rankings"
              description="Most top-3 finishes all time"
            />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {stats.top3List.slice(0, 6).map(([name, count], i) => {
                  const titleCount = stats.titles[name] || 0;
                  return (
                    <div key={name} className="flex items-center gap-4 px-5 py-3 hover:bg-white/5 transition-colors">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-sm font-bold ${
                        i < 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-gray-300"
                      }`}>
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">{name}</p>
                        <p className="text-xs text-gray-400">
                          {titleCount > 0 ? `${titleCount} title${titleCount > 1 ? "s" : ""}` : "0 titles"}
                          {" / "}
                          {count} top-3 finish{count > 1 ? "es" : ""}
                        </p>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: count }).map((_, j) => (
                          <div
                            key={j}
                            className={`h-2 w-2 rounded-full ${
                              j < titleCount ? "bg-[#DD550C]" : "bg-[#DD550C]/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* The Roster strip */}
      <Container className="pt-0">
        <div className="text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-[#DD550C]">
            The Roster
          </h2>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {members.active.map((m) => {
              const initials = m.name.split(/\s+/).map((s) => s.charAt(0).toUpperCase()).slice(0, 2).join("");
              const titleCount = stats.titles[m.name] || 0;
              return (
                <Link key={m.name} href={`/managers/${encodeURIComponent(m.name.toLowerCase())}`} className="group flex flex-col items-center gap-1.5 transition-transform duration-300 hover:scale-110">
                  <div className={`relative flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg transition-shadow group-hover:shadow-[#DD550C]/40 ${
                    titleCount > 0
                      ? "bg-gradient-to-br from-[#DD550C] to-[#a33d08] shadow-[#DD550C]/30"
                      : "bg-gradient-to-br from-[#DD550C] to-[#a33d08] shadow-[#DD550C]/20"
                  }`}>
                    {initials}
                    {titleCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#DD550C] text-[8px] font-bold text-white ring-2 ring-[#0C2340]">
                        {titleCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 group-hover:text-[#DD550C] transition-colors">
                    {m.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </Container>

      {/* Two-column previews (in-season) or Season Awaits banner (offseason) */}
      {isOffseason ? (
        <Container className="pt-0">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#183558] to-[#0a1c30] px-8 py-16 text-center">
            <div className="stripe-pattern pointer-events-none absolute inset-0 opacity-50" aria-hidden />
            <div className="relative">
              <p className="text-5xl" aria-hidden>🏈</p>
              <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
                Season Awaits
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-gray-300">
                Study the record book. Review the rules. Start the trash talk early.
                When the season opens, this site lights up with live data.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/rules" className="font-[family-name:var(--font-heading)] rounded-lg border border-[#DD550C]/40 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[#DD550C] transition-all hover:bg-[#DD550C]/10">
                  League Rules
                </Link>
                <Link href="/records" className="font-[family-name:var(--font-heading)] rounded-lg border border-white/15 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-all hover:bg-white/5">
                  Record Book
                </Link>
              </div>
            </div>
          </div>
        </Container>
      ) : (
        <Container className="pt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            <Suspense fallback={<PreviewSkeleton />}>
              <StandingsPreview />
            </Suspense>
            <Suspense fallback={<PreviewSkeleton />}>
              <ScoreboardPreview />
            </Suspense>
          </div>
        </Container>
      )}

      {/* Articles */}
      <Container className="pt-0">
        <ArticlesPreview />
      </Container>
    </>
  );
}
