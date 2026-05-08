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

export const dynamic = "force-dynamic";

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
  // Fetch settings to determine if we're in-season or offseason
  const settingsResult = await fetchSettings();
  const isOffseason = !settingsResult.ok;
  const season = settingsResult.ok ? settingsResult.data.season : null;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#183558] via-[#112d4e] to-[#0C2340]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#DD550C_1px,transparent_1px)] [background-size:24px_24px]"
        />
        <Container className="relative py-16 sm:py-20 lg:py-28">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-[#DD550C]">
                {season ? `${season} Season` : "Est. 2013"}
              </p>
              <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
                Greybushes <span className="text-[#DD550C]">&amp;</span> Chili Dogs
              </h1>
              <p className="mt-4 max-w-2xl text-lg sm:text-xl italic text-gray-300">
                A bunch of degenerates who claim to be extraordinary swindlers.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/standings"
                  className="rounded-md bg-[#DD550C] px-4 py-2 text-sm font-semibold text-[#0C2340] hover:bg-orange-500 transition-colors"
                >
                  View Standings
                </Link>
                <Link
                  href="/power-rankings"
                  className="rounded-md border border-[#DD550C]/40 px-4 py-2 text-sm font-semibold text-[#DD550C] hover:bg-[#DD550C]/10 transition-colors"
                >
                  Power Rankings
                </Link>
                <Link
                  href="/matchups"
                  className="rounded-md border border-[#DD550C]/40 px-4 py-2 text-sm font-semibold text-[#DD550C] hover:bg-[#DD550C]/10 transition-colors"
                >
                  This Week&apos;s Matchups
                </Link>
                <Link
                  href="/wall-of-shame"
                  className="rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5 transition-colors"
                >
                  Wall of Shame
                </Link>
              </div>
            </div>
            {isOffseason && (
              <div className="lg:w-80 flex-shrink-0">
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

      {/* Two-column previews */}
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

      {/* Articles */}
      <Container className="pt-0">
        <ArticlesPreview />
      </Container>
    </>
  );
}
