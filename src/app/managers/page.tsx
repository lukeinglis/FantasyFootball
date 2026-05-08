import type { Metadata } from "next";
import Link from "next/link";
import { getAllManagerNames, buildManagerProfile, getManagerSlug } from "@/lib/managers";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";

export const metadata: Metadata = {
  title: "Managers",
  description: "Every manager who has ever played in Greybushes & Chili Dogs, with full draft profiles.",
};

const POS_COLORS: Record<string, string> = {
  QB: "text-rose-300",
  RB: "text-emerald-300",
  WR: "text-sky-300",
  TE: "text-amber-300",
  K: "text-violet-300",
  DEF: "text-slate-300",
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

  return (
    <Link
      href={`/managers/${profile.slug}`}
      className="group block rounded-2xl border border-white/10 bg-[#112d4e] p-5 transition-all duration-300 hover:border-[#DD550C]/30 hover:shadow-lg hover:shadow-[#DD550C]/10 hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-4">
        <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#DD550C] to-[#a33d08] text-base font-bold text-white shadow-lg shadow-[#DD550C]/20 transition-transform duration-300 group-hover:scale-110">
          {initials}
          {profile.championships > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#DD550C] text-[9px] font-bold text-white ring-2 ring-[#112d4e]">
              {profile.championships}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-[family-name:var(--font-heading)] font-semibold uppercase tracking-wide text-white">
            {profile.name}
          </p>
          <p className="truncate text-sm text-gray-400 italic">
            {profile.currentTeamName || "No team"}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>{profile.yearsActive.length} seasons</span>
            <span className="text-white/20">|</span>
            <span>{profile.totalPicks} picks</span>
            {profile.championships > 0 && (
              <>
                <span className="text-white/20">|</span>
                <span className="text-[#DD550C]">🏆 {profile.championships}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Position tendency mini-bar */}
      {totalPicks > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            {topPos.map(([pos, count]) => {
              const pct = (count / totalPicks) * 100;
              const colorClass = POS_COLORS[pos] || "text-gray-300";
              const bgColor = colorClass.replace("text-", "bg-").replace("-300", "-500/60");
              return (
                <div key={pos} className={`h-full ${bgColor}`} style={{ width: `${pct}%` }} />
              );
            })}
          </div>
          <div className="flex gap-1.5 text-[9px] font-bold">
            {topPos.slice(0, 3).map(([pos]) => (
              <span key={pos} className={POS_COLORS[pos] || "text-gray-300"}>
                {pos}
              </span>
            ))}
          </div>
        </div>
      )}
    </Link>
  );
}
