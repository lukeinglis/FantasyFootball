import Link from "next/link";
import { Suspense } from "react";
import { Card, CardBody, CardHeader } from "@/components/Card";
import StandingsPreview from "@/components/home/StandingsPreview";
import ScoreboardPreview from "@/components/home/ScoreboardPreview";
import ArticlesPreview from "@/components/home/ArticlesPreview";
import SeasonCountdown from "@/components/SeasonCountdown";

interface MobileHubProps {
  isOffseason: boolean;
  defendingChamp?: {
    year: number;
    champion?: string;
    championTeam?: string;
  };
}

function PreviewSkeleton({ lines = 4 }: { lines?: number }) {
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

interface QuickAction {
  href: string;
  label: string;
  icon: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { href: "/draft", label: "Draft", icon: "🃏" },
  { href: "/records", label: "Records", icon: "📖" },
  { href: "/stats", label: "Stats", icon: "📈" },
  { href: "/transactions", label: "Trades", icon: "🤝" },
  { href: "/games", label: "Arcade", icon: "🕹️" },
  { href: "/head-to-head", label: "H2H", icon: "⚔️" },
];

export default function MobileHub({
  isOffseason,
  defendingChamp,
}: MobileHubProps) {
  return (
    <div className="md:hidden px-4 pt-6 pb-4 space-y-3">
      {/* Hero title (compact for mobile) */}
      <div className="text-center pb-2">
        <p className="font-[family-name:var(--font-heading)] text-sm text-[#FFD23F] uppercase tracking-[0.3em] text-shadow-sm">
          Est. 2015
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[#F5F0E8] text-shadow-wood-lg leading-tight">
          Greybushes<span className="text-[#FFD23F]"> & </span>Chili Dogs
        </h1>
        <p className="mt-2 font-[family-name:var(--font-body)] text-xs text-[#F5F0E8]/60 font-semibold text-shadow-sm">
          A bunch of degenerates who claim to be extraordinary swindlers
        </p>
      </div>

      {isOffseason ? (
        <>
          {/* Season Countdown */}
          <SeasonCountdown />

          {/* Season Awaits */}
          <Card variant="chalkboard">
            <CardBody variant="chalkboard">
              <div className="text-center py-4">
                <p className="text-4xl" aria-hidden>
                  🏈
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl tracking-wide text-[#F5F0E8] text-shadow-md">
                  Season Awaits
                </h2>
                <p className="mx-auto mt-2 max-w-xs text-sm text-[#F5F0E8]/70">
                  Study the record book. Review the rules. Start the trash talk
                  early.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Link
                    href="/league?tab=rules"
                    className="font-[family-name:var(--font-heading)] rounded-lg border border-[#D4A847]/40 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#D4A847] transition-all hover:bg-[#D4A847]/10 min-h-[44px] flex items-center"
                  >
                    League Rules
                  </Link>
                  <Link
                    href="/records"
                    className="font-[family-name:var(--font-heading)] rounded-lg border border-[#F5F0E8]/15 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#F5F0E8] transition-all hover:bg-white/5 min-h-[44px] flex items-center"
                  >
                    Record Book
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      ) : (
        <>
          {/* Live Scores */}
          <Suspense fallback={<PreviewSkeleton />}>
            <ScoreboardPreview />
          </Suspense>

          {/* Standings Preview */}
          <Suspense fallback={<PreviewSkeleton />}>
            <StandingsPreview />
          </Suspense>
        </>
      )}

      {/* Quick Actions */}
      <Card variant="chalkboard">
        <CardHeader title="Quick Actions" variant="chalkboard" />
        <CardBody variant="chalkboard">
          <div className="grid grid-cols-3 gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-1.5 rounded-lg bg-white/5 p-3 min-h-[44px] transition-colors active:bg-white/10"
              >
                <span className="text-2xl" aria-hidden>
                  {action.icon}
                </span>
                <span className="font-[family-name:var(--font-heading)] text-[10px] uppercase tracking-wide text-[#F5F0E8]/80">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Champion Banner */}
      {defendingChamp?.champion && (
        <Card variant="trading-card">
          <CardBody variant="trading-card">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#DD550C] to-[#a33d08] text-2xl shadow-lg shadow-[#DD550C]/30">
                🏆
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-[family-name:var(--font-heading)] text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A0784C]">
                  {defendingChamp.year} Defending Champion
                </p>
                <p className="mt-0.5 font-[family-name:var(--font-display)] text-xl text-[#2C1810]">
                  {defendingChamp.champion}
                </p>
                {defendingChamp.championTeam && (
                  <p className="text-xs text-[#6B5744]">
                    {defendingChamp.championTeam}
                  </p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Recent Activity */}
      <ArticlesPreview />
    </div>
  );
}
