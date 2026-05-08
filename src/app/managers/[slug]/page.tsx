import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildManagerProfile, slugToName, getAllManagerNames, getManagerSlug } from "@/lib/managers";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardBody, CardHeader } from "@/components/Card";

export function generateStaticParams() {
  const names = getAllManagerNames();
  return names.map((name) => ({ slug: getManagerSlug(name) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = slugToName(slug);
  return {
    title: `${name} Profile`,
    description: `Draft history and league stats for ${name} in Greybushes & Chili Dogs.`,
  };
}

const POS_COLORS: Record<string, string> = {
  QB: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  RB: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  WR: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  TE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  K: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  DEF: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export default async function ManagerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const name = slugToName(slug);
  const profile = buildManagerProfile(name);

  if (!profile) notFound();

  const topPositions = Object.entries(profile.positionBreakdown)
    .sort((a, b) => b[1] - a[1]);
  const totalPosPicks = topPositions.reduce((s, [, c]) => s + c, 0);

  const topNflTeams = Object.entries(profile.nflTeamBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const podiumTotal = profile.championships + profile.runnerUpYears.length + profile.thirdPlaceYears.length;

  return (
    <>
      <PageHeader
        eyebrow={profile.isActive ? "Active Manager" : profile.isEmeritus ? "Emeritus" : "Historical"}
        title={profile.name}
        subtitle={profile.currentTeamName || undefined}
      >
        <Link
          href="/managers"
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/5"
        >
          All Managers
        </Link>
      </PageHeader>

      <Container>
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <StatCard label="Seasons" value={String(profile.yearsActive.length)} />
          <StatCard label="Titles" value={String(profile.championships)} highlight={profile.championships > 0} />
          <StatCard label="Podiums" value={String(podiumTotal)} />
          <StatCard label="Total Picks" value={profile.totalPicks.toLocaleString()} />
          <StatCard label="First Active" value={String(Math.min(...profile.yearsActive))} />
          <StatCard label="Last Active" value={String(Math.max(...profile.yearsActive))} />
        </div>
      </Container>

      {/* Season Results Timeline */}
      {(profile.championshipYears.length > 0 || profile.runnerUpYears.length > 0 || profile.thirdPlaceYears.length > 0) && (
        <Container className="pt-0">
          <Card className="overflow-hidden">
            <CardHeader title="Trophy Case" />
            <CardBody>
              <div className="flex flex-wrap gap-3">
                {profile.championshipYears.map((y) => (
                  <div key={`champ-${y}`} className="flex items-center gap-2 rounded-xl bg-[#DD550C]/10 border border-[#DD550C]/30 px-4 py-2">
                    <span className="text-xl">🏆</span>
                    <div>
                      <p className="font-[family-name:var(--font-heading)] font-bold text-[#DD550C]">{y}</p>
                      <p className="text-[10px] text-gray-400 uppercase">Champion</p>
                    </div>
                  </div>
                ))}
                {profile.runnerUpYears.map((y) => (
                  <div key={`ru-${y}`} className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2">
                    <span className="text-xl">🥈</span>
                    <div>
                      <p className="font-[family-name:var(--font-heading)] font-bold text-white">{y}</p>
                      <p className="text-[10px] text-gray-400 uppercase">Runner-Up</p>
                    </div>
                  </div>
                ))}
                {profile.thirdPlaceYears.map((y) => (
                  <div key={`3rd-${y}`} className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2">
                    <span className="text-xl">🥉</span>
                    <div>
                      <p className="font-[family-name:var(--font-heading)] font-bold text-white">{y}</p>
                      <p className="text-[10px] text-gray-400 uppercase">Third</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Container>
      )}

      <Container className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Position Breakdown */}
          <Card className="overflow-hidden">
            <CardHeader title="Draft Tendencies" description="Position breakdown across all drafts" />
            <CardBody>
              <div className="space-y-3">
                {topPositions.map(([pos, count]) => {
                  const pct = totalPosPicks > 0 ? Math.round((count / totalPosPicks) * 100) : 0;
                  return (
                    <div key={pos}>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${POS_COLORS[pos] || "bg-white/10 text-gray-200 border-white/20"}`}>
                          {pos}
                        </span>
                        <span className="font-mono text-gray-300">{count} picks ({pct}%)</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#DD550C] to-[#ff8a3d]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Favorite NFL Teams */}
          <Card className="overflow-hidden">
            <CardHeader title="Favorite NFL Teams" description="Most drafted from across all seasons" />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {topNflTeams.map(([team, count], i) => (
                  <div key={team} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-heading)] text-xs font-bold ${
                      i < 3 ? "bg-[#DD550C] text-white" : "bg-white/10 text-gray-300"
                    }`}>{i + 1}</span>
                    <p className="font-semibold text-white flex-1">{team}</p>
                    <span className="font-mono text-sm text-gray-400">{count} picks</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* Team Name Evolution */}
      {profile.teamNames.length > 1 && (
        <Container className="pt-0">
          <Card className="overflow-hidden">
            <CardHeader title="Team Name Evolution" description="The rebrand history" />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {profile.teamNames.map((tn) => (
                  <div key={tn.year} className="flex items-center gap-4 px-5 py-2.5 hover:bg-white/5 transition-colors">
                    <span className="font-[family-name:var(--font-heading)] font-mono text-lg font-bold text-[#DD550C]">{tn.year}</span>
                    <p className="text-white">{tn.teamName}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Container>
      )}

      {/* First Round Picks History */}
      {profile.firstRoundPicks.length > 0 && (
        <Container className="pt-0">
          <Card className="overflow-hidden">
            <CardHeader
              title="First Round Picks"
              description={`${profile.firstRoundPicks.length} first rounders across ${profile.yearsActive.length} drafts`}
            />
            <CardBody className="!p-0">
              <div className="divide-y divide-white/5">
                {profile.firstRoundPicks.sort((a, b) => {
                  const yearA = profile.draftsByYear.find((d) => d.picks.includes(a));
                  const yearB = profile.draftsByYear.find((d) => d.picks.includes(b));
                  return (yearB?.year || 0) - (yearA?.year || 0);
                }).map((p) => {
                  const draftYear = profile.draftsByYear.find((d) => d.picks.some((dp) => dp.pick === p.pick && dp.playerKey === p.playerKey));
                  const posClass = POS_COLORS[p.position] || "bg-white/10 text-gray-200 border-white/20";
                  return (
                    <div key={`${draftYear?.year}-${p.pick}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 transition-colors">
                      <span className="font-[family-name:var(--font-heading)] font-mono text-sm font-bold text-[#DD550C] w-10">{draftYear?.year}</span>
                      <span className="font-mono text-xs text-gray-500 w-8">#{p.pick}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${posClass}`}>{p.position}</span>
                      <p className="font-semibold text-white flex-1">{p.playerName}</p>
                      <span className="text-xs text-gray-400">{p.nflTeam}</span>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </Container>
      )}

      {/* Full Draft History by Year */}
      <Container className="pt-0">
        <Card className="overflow-hidden">
          <CardHeader title="Complete Draft History" description="Every pick, every year" />
          <CardBody className="!p-0">
            {profile.draftsByYear.map((draft) => (
              <div key={draft.year}>
                <div className="bg-[#0C2340] px-5 py-2 border-t border-white/10">
                  <p className="font-[family-name:var(--font-heading)] text-sm font-bold uppercase tracking-wide text-[#DD550C]">
                    {draft.year} Draft
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {draft.picks.length} picks
                    </span>
                  </p>
                </div>
                <div className="divide-y divide-white/5">
                  {draft.picks.sort((a, b) => a.round - b.round).map((p) => {
                    const posClass = POS_COLORS[p.position] || "bg-white/10 text-gray-200 border-white/20";
                    return (
                      <div key={`${draft.year}-${p.pick}`} className="flex items-center gap-2 px-5 py-1.5 text-sm hover:bg-white/5 transition-colors">
                        <span className="font-mono text-[10px] text-gray-500 w-6">R{p.round}</span>
                        <span className="font-mono text-[10px] text-gray-500 w-8">#{p.pick}</span>
                        <span className={`rounded-full border px-1.5 py-0 text-[9px] font-bold ${posClass}`}>{p.position}</span>
                        <span className="text-white flex-1 truncate">{p.playerName}</span>
                        <span className="text-xs text-gray-500">{p.nflTeam}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </Container>
    </>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#112d4e] p-4 text-center">
      <p className="font-[family-name:var(--font-heading)] text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">{label}</p>
      <p className={`mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold ${highlight ? "text-gradient" : "text-white"}`}>{value}</p>
    </div>
  );
}
