import type { Metadata } from "next";
import Link from "next/link";
import { getAllManagerNames, buildManagerProfile, getManagerSlug } from "@/lib/managers";
import { getManagerCareerStats } from "@/lib/manager-stats";
import type { ManagerCareerStats } from "@/lib/manager-stats";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card } from "@/components/Card";
import { POS_FILL, POS_TEXT } from "@/lib/records";

export const metadata: Metadata = {
  title: "Managers",
  description: "Every manager who has ever played in Greybushes & Chili Dogs, with full draft profiles.",
};

export default function ManagersPage() {
  const names = getAllManagerNames();
  const profiles = names
    .map((n) => buildManagerProfile(n))
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      if (a.championships !== b.championships) return b.championships - a.championships;
      return b.yearsActive.length - a.yearsActive.length;
    });

  const active = profiles.filter((p) => p.isActive);
  const others = profiles.filter((p) => !p.isActive);

  return (
    <>
      <PageHeader
        eyebrow="The Franchise"
        title="Managers"
        subtitle={`${profiles.length} managers across ${new Set(profiles.flatMap((p) => p.yearsActive)).size > 0 ? "11" : "0"} seasons of Greybushes & Chili Dogs history.`}
      />
      <Container>
        <h2 className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-result">
          Active ({active.length})
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((p) => (
            <li key={p.name}>
              <ManagerCard profile={p} />
            </li>
          ))}
        </ul>

        {others.length > 0 && (
          <>
            <h2 className="mt-12 font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-result">
              Alumni ({others.length})
            </h2>
            <p className="mt-1 max-w-xl text-xs text-ink-muted">
              Former managers who left their mark on the league.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((p) => (
                <li key={p.name}>
                  <ManagerCard profile={p} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Container>
    </>
  );
}

function ManagerCard({
  profile,
}: {
  profile: NonNullable<ReturnType<typeof buildManagerProfile>>;
}) {
  const initials = profile.name
    .split(/\s+/)
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  const topPos = Object.entries(profile.positionBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const totalPicks = Object.values(profile.positionBreakdown).reduce((s, c) => s + c, 0);

  const careerStats: ManagerCareerStats | null = getManagerCareerStats(profile.slug);

  return (
    <Link href={`/managers/${profile.slug}`} className="group block">
      {/* Seventeen of these sit on one page, so the chrome stays quiet: a
          hairline box, the name in the display face, and colour reserved for
          the one fact that is actually rare, a title. A solid red bar on every
          card made the page shout and made the champions impossible to spot. */}
      <Card variant="trading-card">
        <div className="flex items-baseline justify-between gap-2 border-b border-ink px-4 py-2">
          <p className="truncate font-[family-name:var(--wire-display)] text-[15px] font-extrabold uppercase tracking-[0.02em] text-ink">
            {profile.name}
          </p>
          {profile.championships > 0 && (
            <span className="flex-shrink-0 bg-record px-1.5 py-0.5 font-[family-name:var(--wire-mono)] text-[9px] uppercase tracking-[0.1em] text-white">
              {profile.championships}
              {profile.championships === 1 ? " title" : " titles"}
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border border-ink bg-paper font-[family-name:var(--wire-display)] text-[17px] font-extrabold uppercase text-ink">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-[family-name:var(--wire-body)] text-sm italic text-ink-soft">
                {profile.currentTeamName || "No team"}
              </p>
              <div className="mt-1 flex items-center gap-2 font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.08em] text-ink-muted">
                <span>{profile.yearsActive.length} seasons</span>
                <span className="text-rule">·</span>
                <span>{profile.totalPicks} picks</span>
              </div>
            </div>
          </div>

          {careerStats && careerStats.seasonsPlayed > 0 && (
            <div className="mt-3 flex items-baseline gap-3 border-t border-rule pt-2 font-[family-name:var(--wire-mono)] text-[12px] tabular-nums">
              <span className="font-semibold text-ink">
                {careerStats.wins}-{careerStats.losses}{careerStats.ties > 0 ? `-${careerStats.ties}` : ""}
              </span>
              {/* Above .500 or below it is the only thing this number says.
                  Painting all seventeen of them red said nothing. */}
              <span className={careerStats.winPct >= 50 ? "text-ink" : "text-ink-muted"}>
                {careerStats.winPct}%
              </span>
              <span className="ml-auto text-ink-muted">{careerStats.totalPointsFor.toLocaleString()} PF</span>
            </div>
          )}

          {totalPicks > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-1.5 flex-1 overflow-hidden bg-rule">
                {topPos.map(([pos, count]) => {
                  const pct = (count / totalPicks) * 100;
                  return (
                    <div
                      key={pos}
                      className={`h-full ${POS_FILL[pos] ?? "bg-slate-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  );
                })}
              </div>
              <div className="flex gap-1.5 font-[family-name:var(--wire-mono)] text-[9px] font-bold">
                {topPos.slice(0, 3).map(([pos]) => (
                  <span key={pos} className={POS_TEXT[pos] ?? "text-slate-700"}>
                    {pos}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
