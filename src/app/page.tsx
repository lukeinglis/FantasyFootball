import Link from "next/link";
import { Suspense } from "react";
import Container from "@/components/Container";
import StandingsPreview from "@/components/home/StandingsPreview";
import ScoreboardPreview from "@/components/home/ScoreboardPreview";
import ArticlesPreview from "@/components/home/ArticlesPreview";
import SeasonAtAGlance from "@/components/home/SeasonAtAGlance";
import SeasonCountdown from "@/components/SeasonCountdown";
import { Card, CardBody } from "@/components/Card";
import { fetchSettings } from "@/lib/server-data";
import membersData from "@/data/members.json";
import { PAYOUTS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const members = membersData as { active: { name: string; teamName: string }[]; emeritus: { name: string; teamName: string }[] };

function PreviewSkeleton({ lines = 5 }: { lines?: number }) {
  return (
    <Card>
      <CardBody>
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-md bg-white/10"
            />
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

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#1a3a5c] via-[#112d4e] to-[#0a1c30]">
        <div className="stripe-pattern pointer-events-none absolute inset-0 opacity-80" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 dot-pattern opacity-[0.04]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-full w-1/2"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(221, 85, 12, 0.12), transparent 70%)",
          }}
        />
        <Container className="relative py-20 sm:py-24 lg:py-32">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="animate-fade-in-up">
              <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.3em] text-[#DD550C] sm:text-sm">
                {season ? `${season} Season` : "Est. 2013"}
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
                  href="/power-rankings"
                  className="font-[family-name:var(--font-heading)] rounded-lg border border-[#DD550C]/40 px-6 py-3 text-base font-bold uppercase tracking-wide text-[#DD550C] transition-all hover:bg-[#DD550C]/10"
                >
                  Power Rankings
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

      {/* Season summary */}
      <Container>
        <Suspense fallback={<PreviewSkeleton lines={2} />}>
          <SeasonAtAGlance />
        </Suspense>
      </Container>

      {/* Offseason: League Intel cards */}
      {isOffseason && (
        <Container className="pt-0">
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/payouts" className="group">
              <Card variant="glass" className="h-full">
                <CardBody>
                  <div className="animate-fade-in-up text-center" style={{ animationDelay: "0.1s" }}>
                    <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      The Pot
                    </p>
                    <p className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-bold text-gradient">
                      ${PAYOUTS.totalPot.toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      ${PAYOUTS.buyIn} buy-in / {members.active.length} managers
                    </p>
                  </div>
                </CardBody>
              </Card>
            </Link>
            <Link href="/history" className="group">
              <Card variant="glass" className="h-full">
                <CardBody>
                  <div className="animate-fade-in-up text-center" style={{ animationDelay: "0.2s" }}>
                    <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      League Legacy
                    </p>
                    <p className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-bold text-gradient">
                      Est. 2013
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      13 seasons of questionable decisions
                    </p>
                  </div>
                </CardBody>
              </Card>
            </Link>
            <Link href="/members" className="group">
              <Card variant="glass" className="h-full">
                <CardBody>
                  <div className="animate-fade-in-up text-center" style={{ animationDelay: "0.3s" }}>
                    <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      The Field
                    </p>
                    <p className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-bold text-gradient">
                      {members.active.length} Active
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      Plus {members.emeritus.length} legends in the emeritus wing
                    </p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          </div>
        </Container>
      )}

      {/* The Roster strip */}
      {isOffseason && (
        <Container className="pt-0">
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-[#DD550C]">
              The Roster
            </h2>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {members.active.map((m) => {
                const initials = m.name
                  .split(/\s+/)
                  .map((s) => s.charAt(0).toUpperCase())
                  .slice(0, 2)
                  .join("");
                return (
                  <div
                    key={m.name}
                    className="group flex flex-col items-center gap-1.5 transition-transform duration-300 hover:scale-110"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#DD550C] to-[#a33d08] text-sm font-bold text-white shadow-lg shadow-[#DD550C]/20 transition-shadow group-hover:shadow-[#DD550C]/40">
                      {initials}
                    </div>
                    <span className="text-[10px] text-gray-400 group-hover:text-[#DD550C] transition-colors">
                      {m.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      )}

      {/* Two-column previews (in-season) or Season Awaits banner (offseason) */}
      {isOffseason ? (
        <Container className="pt-0">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#183558] to-[#0a1c30] px-8 py-16 text-center">
            <div className="stripe-pattern pointer-events-none absolute inset-0 opacity-50" aria-hidden />
            <div className="relative">
              <p className="text-5xl" aria-hidden>
                🏈
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
                Season Awaits
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-gray-300">
                Study the record book. Review the rules. Start the trash talk early.
                When the season opens, this site lights up with live data.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/rules"
                  className="font-[family-name:var(--font-heading)] rounded-lg border border-[#DD550C]/40 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[#DD550C] transition-all hover:bg-[#DD550C]/10"
                >
                  League Rules
                </Link>
                <Link
                  href="/records"
                  className="font-[family-name:var(--font-heading)] rounded-lg border border-white/15 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-all hover:bg-white/5"
                >
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
