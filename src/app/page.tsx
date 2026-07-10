import Link from "next/link";
import { Suspense } from "react";
import Container from "@/components/Container";
import StandingsPreview from "@/components/home/StandingsPreview";
import ScoreboardPreview from "@/components/home/ScoreboardPreview";
import ArticlesPreview from "@/components/home/ArticlesPreview";
import SeasonAtAGlance from "@/components/home/SeasonAtAGlance";
import SeasonCountdown from "@/components/SeasonCountdown";
import GameZone from "@/components/home/GameZone";
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
      <section className="relative overflow-hidden border-b-4 border-[#D4A847] bg-[linear-gradient(180deg,#2C1810,#1A0F08)]">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-full w-1/2"
          style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(212,168,71,0.08), transparent 70%)" }}
        />
        <Container className="relative py-20 sm:py-24 lg:py-32">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="animate-fade-in-up">
              <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.3em] text-[#D4A847] sm:text-sm">
                {season ? `${season} Season` : `${history.seasons.length} Seasons Strong`}
              </p>
              <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl tracking-tight text-[#F5F0E8] sm:text-6xl lg:text-7xl" style={{ textShadow: "3px 3px 0 #5C3A1E, 0 0 20px rgba(0,0,0,0.3)" }}>
                Greybushes{" "}
                <span className="text-[#FFD23F]">&amp;</span>{" "}
                Chili Dogs
              </h1>
              <p className="mt-4 max-w-2xl text-xl text-[#F5F0E8]/70 sm:text-2xl">
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
                  className="font-[family-name:var(--font-heading)] rounded-lg border border-[#D4A847]/40 px-6 py-3 text-base font-bold uppercase tracking-wide text-[#D4A847] transition-all hover:bg-[#D4A847]/10"
                >
                  Hall of Champions
                </Link>
                <Link
                  href="/wall-of-shame"
                  className="font-[family-name:var(--font-heading)] rounded-lg border border-[#F5F0E8]/15 px-6 py-3 text-base font-bold uppercase tracking-wide text-[#F5F0E8] transition-all hover:bg-white/5"
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
          <div className="relative overflow-hidden rounded-xl border-[3px] border-[#D4A847] bg-[linear-gradient(180deg,#2C1810,#1A0F08)] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-[3px] bg-[linear-gradient(90deg,transparent,#D4A847_20%,#D4A847_80%,transparent)]" aria-hidden />
            <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#DD550C] to-[#a33d08] text-3xl shadow-lg shadow-[#DD550C]/30">
                🏆
              </div>
              <div>
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-[#D4A847]">
                  {defendingChamp.year} Defending Champion
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[#F5F0E8] sm:text-3xl" style={{ textShadow: "2px 2px 0 #5C3A1E" }}>
                  {defendingChamp.champion}
                </p>
                <p className="text-sm text-[#F5F0E8]/50">
                  {defendingChamp.championTeam}
                </p>
              </div>
              <div className="hidden sm:block sm:ml-auto">
                <Link
                  href="/history"
                  className="font-[family-name:var(--font-heading)] rounded-lg border border-[#D4A847]/40 px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#D4A847] transition-all hover:bg-[#D4A847]/10"
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
          <Card variant="scoreboard">
            <CardBody>
              <div className="text-center">
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-[#F5F0E8]/50">Seasons Played</p>
                <p className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-bold text-[#FFD23F]" style={{ textShadow: "0 0 6px rgba(255,210,63,0.3)" }}>{history.seasons.length}</p>
                <p className="mt-1 text-sm text-[#F5F0E8]/50">{history.seasons[history.seasons.length - 1]?.year} to {history.seasons[0]?.year}</p>
              </div>
            </CardBody>
          </Card>
          <Card variant="scoreboard">
            <CardBody>
              <div className="text-center">
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-[#F5F0E8]/50">Unique Champions</p>
                <p className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-bold text-[#FFD23F]" style={{ textShadow: "0 0 6px rgba(255,210,63,0.3)" }}>{stats.uniqueChamps}</p>
                <p className="mt-1 text-sm text-[#F5F0E8]/50">No repeat winners</p>
              </div>
            </CardBody>
          </Card>
          <Card variant="scoreboard">
            <CardBody>
              <div className="text-center">
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-[#F5F0E8]/50">The Pot</p>
                <p className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-bold text-[#FFD23F]" style={{ textShadow: "0 0 6px rgba(255,210,63,0.3)" }}>${PAYOUTS.totalPot.toLocaleString()}</p>
                <p className="mt-1 text-sm text-[#F5F0E8]/50">${PAYOUTS.buyIn} buy-in / {members.active.length} managers</p>
              </div>
            </CardBody>
          </Card>
          <Card variant="scoreboard">
            <CardBody>
              <div className="text-center">
                <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-[#F5F0E8]/50">Active Managers</p>
                <p className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-bold text-[#FFD23F]" style={{ textShadow: "0 0 6px rgba(255,210,63,0.3)" }}>{members.active.length}</p>
                <p className="mt-1 text-sm text-[#F5F0E8]/50">Plus {members.emeritus.length} emeritus</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* Recent Champions + Dynasty Rankings side by side */}
      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Champions */}
          <Card className="overflow-hidden" variant="scoreboard">
            <CardHeader
              title="Recent Champions"
              action={<Link href="/history" className="text-xs font-medium text-[#D4A847] hover:underline">View all &rarr;</Link>}
            />
            <CardBody className="!p-0">
              <div className="divide-y divide-[#D4A847]/10">
                {recentSeasons.map((s, i) => (
                  <div key={s.year} className="flex items-center gap-4 px-5 py-3 hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                    <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#FFD23F]">{s.year}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#F5F0E8]">
                        {i === 0 && <span className="mr-1.5">🏆</span>}
                        {s.champion}
                      </p>
                      <p className="truncate text-xs text-[#F5F0E8]/50">{s.championTeam}</p>
                    </div>
                    <div className="hidden sm:block text-right text-xs text-[#F5F0E8]/40">
                      <p>2nd: {s.runnerUp}</p>
                      <p>3rd: {s.third}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Dynasty Rankings */}
          <Card className="overflow-hidden" variant="scoreboard">
            <CardHeader
              title="Dynasty Rankings"
              description="Most top-3 finishes all time"
            />
            <CardBody className="!p-0">
              <div className="divide-y divide-[#D4A847]/10">
                {stats.top3List.slice(0, 6).map(([name, count], i) => {
                  const titleCount = stats.titles[name] || 0;
                  return (
                    <div key={name} className="flex items-center gap-4 px-5 py-3 hover:bg-[rgba(212,168,71,0.08)] transition-colors">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-sm font-bold ${
                        i < 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-[#F5F0E8]/60"
                      }`}>
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[#F5F0E8]">{name}</p>
                        <p className="text-xs text-[#F5F0E8]/50">
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
          <h2 className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-[#D4A847]">
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
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4A847] text-[8px] font-bold text-[#2C1810] ring-2 ring-[#2D8C3C]">
                        {titleCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#F5F0E8]/60 group-hover:text-[#D4A847] transition-colors">
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
          <div className="relative overflow-hidden rounded-xl border-[3px] border-[#8B5E3C] bg-[#2A4A3A] px-8 py-16 text-center shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_0_30px_rgba(0,0,0,0.2)]">
            <div className="relative">
              <p className="text-5xl" aria-hidden>🏈</p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl tracking-wide text-[#F5F0E8] sm:text-4xl" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}>
                Season Awaits
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-[#F5F0E8]/70">
                Study the record book. Review the rules. Start the trash talk early.
                When the season opens, this site lights up with live data.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/rules" className="font-[family-name:var(--font-heading)] rounded-lg border border-[#D4A847]/40 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[#D4A847] transition-all hover:bg-[#D4A847]/10">
                  League Rules
                </Link>
                <Link href="/records" className="font-[family-name:var(--font-heading)] rounded-lg border border-[#F5F0E8]/15 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[#F5F0E8] transition-all hover:bg-white/5">
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

      {/* Game Zone: Breakaway + Field Goal Frenzy */}
      <Container className="pt-0">
        <GameZone />
      </Container>

      {/* Articles */}
      <Container className="pt-0">
        <ArticlesPreview />
      </Container>
    </>
  );
}
