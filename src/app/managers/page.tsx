import type { Metadata } from "next";
import Link from "next/link";
import { getAllManagerNames, buildManagerProfile, getManagerSlug } from "@/lib/managers";
import { getManagerCareerStats } from "@/lib/manager-stats";
import type { ManagerCareerStats } from "@/lib/manager-stats";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card } from "@/components/Card";

export const metadata: Metadata = {
  title: "Managers",
  description: "Every manager who has ever played in Greybushes & Chili Dogs, with full draft profiles.",
};

const POS_COLORS: Record<string, string> = {
  QB: "text-rose-600",
  RB: "text-emerald-700",
  WR: "text-sky-600",
  TE: "text-amber-600",
  K: "text-violet-600",
  DEF: "text-slate-500",
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
        <h2 className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-[#DD550C]">
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
            <h2 className="mt-12 font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-[#DD550C]">
              Alumni ({others.length})
            </h2>
            <p className="mt-1 max-w-xl text-xs text-gray-500">
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
      <Card variant="trading-card">
        <div className="bg-gradient-to-r from-[#D32F2F] to-[#8B1A1A] px-4 py-2 flex items-center justify-between">
          <p className="truncate font-[family-name:var(--font-heading)] text-sm text-white tracking-wide text-shadow-sm">
            {profile.name}
          </p>
          {profile.championships > 0 && (
            <span className="rounded bg-[#FFD700] px-1.5 py-0.5 font-[family-name:var(--font-heading)] text-[10px] text-[#2C1810] tracking-wide">
              {profile.championships}x Champ
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4A90D9] to-[#1565C0] border-3 border-[#A0784C] font-[family-name:var(--font-heading)] text-lg text-white text-shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-[#6B5744] italic">
                {profile.currentTeamName || "No team"}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs text-[#6B5744]">
                <span>{profile.yearsActive.length} seasons</span>
                <span className="text-[#A0784C]">·</span>
                <span>{profile.totalPicks} picks</span>
              </div>
            </div>
          </div>

          {careerStats && careerStats.seasonsPlayed > 0 && (
            <div className="mt-3 flex items-center gap-3 border-t border-dashed border-[#A0784C]/30 pt-2 text-xs">
              <span className="text-[#2C1810] font-semibold">
                {careerStats.wins}-{careerStats.losses}{careerStats.ties > 0 ? `-${careerStats.ties}` : ""}
              </span>
              <span className="text-[#DD550C] font-bold">{careerStats.winPct}%</span>
              <span className="text-[#6B5744] ml-auto">{careerStats.totalPointsFor.toLocaleString()} PF</span>
            </div>
          )}

          {totalPicks > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-[#A0784C]/20">
                {topPos.map(([pos, count]) => {
                  const pct = (count / totalPicks) * 100;
                  const colorClass = POS_COLORS[pos] || "text-slate-500";
                  const bgColor = colorClass.replace("text-", "bg-").replace("-600", "-500/60").replace("-700", "-600/60").replace("-500", "-400/60");
                  return (
                    <div key={pos} className={`h-full ${bgColor}`} style={{ width: `${pct}%` }} />
                  );
                })}
              </div>
              <div className="flex gap-1.5 text-[9px] font-bold">
                {topPos.slice(0, 3).map(([pos]) => (
                  <span key={pos} className={POS_COLORS[pos] || "text-slate-500"}>
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
