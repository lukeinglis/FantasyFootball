import type { Metadata } from "next";
import historyData from "@/data/history.json";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardBody, CardHeader } from "@/components/Card";
import EmptyState from "@/components/EmptyState";

export const metadata: Metadata = {
  title: "History",
  description: "Past champions and runners-up of Greybushes & Chili Dogs.",
};

interface SeasonRecord {
  year: number | string;
  champion?: string;
  championTeam?: string;
  runnerUp?: string;
  runnerUpTeam?: string;
  third?: string;
  thirdTeam?: string;
  notes?: string;
  milestones?: string[];
}

interface HistoryFile {
  seasons: SeasonRecord[];
}

const data = historyData as HistoryFile;

function nameAndTeam(name?: string, team?: string): string {
  if (name && team) return `${name} (${team})`;
  return name || team || "—";
}

function getTitleCounts(
  seasons: SeasonRecord[]
): { name: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const s of seasons) {
    if (s.champion) counts[s.champion] = (counts[s.champion] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function getBeltTracker(
  seasons: SeasonRecord[]
): { holder: string; from: number | string; to: number | string }[] {
  const chronological = [...seasons].sort((a, b) => {
    const ay = Number(a.year) || 0;
    const by = Number(b.year) || 0;
    return ay - by;
  });

  const reigns: { holder: string; from: number | string; to: number | string }[] =
    [];
  for (const s of chronological) {
    if (!s.champion) continue;
    const last = reigns[reigns.length - 1];
    if (last && last.holder === s.champion) {
      last.to = s.year;
    } else {
      reigns.push({ holder: s.champion, from: s.year, to: s.year });
    }
  }
  return reigns;
}

export default function HistoryPage() {
  const seasons = [...data.seasons].sort((a, b) => {
    const ay = Number(a.year) || 0;
    const by = Number(b.year) || 0;
    return by - ay;
  });

  const titleCounts = getTitleCounts(seasons);
  const uniqueChamps = titleCounts.length;
  const beltTracker = getBeltTracker(seasons);
  const repeatChamps = titleCounts.filter((t) => t.count > 1);

  return (
    <>
      <PageHeader
        eyebrow="The Annals"
        title="League History"
        subtitle={`${seasons.length} seasons. ${uniqueChamps} unique champions.${repeatChamps.length === 0 ? " No repeat winners." : ""}`}
      />
      <Container>
        {/* Summary Cards */}
        {seasons.length > 0 && (
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <Card variant="glass">
              <CardBody>
                <div className="text-center">
                  <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Seasons
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-gradient">
                    {seasons.length}
                  </p>
                </div>
              </CardBody>
            </Card>
            <Card variant="glass">
              <CardBody>
                <div className="text-center">
                  <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Unique Champions
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-gradient">
                    {uniqueChamps}
                  </p>
                </div>
              </CardBody>
            </Card>
            <Card variant="glass">
              <CardBody>
                <div className="text-center">
                  <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Defending Champ
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-gradient">
                    {seasons[0]?.champion || "—"}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {seasons.length === 0 ? (
          <EmptyState
            icon={<span>🏆</span>}
            title="Seasons coming soon"
            description="We're still digging through old screenshots and group chats. Past champions will be added as we recover the receipts."
          />
        ) : (
          <div className="grid gap-10 lg:grid-cols-3">
            {/* Timeline: 2 columns on large screens */}
            <div className="lg:col-span-2">
              <div className="relative border-s-2 border-[#DD550C]/30 ms-4 sm:ms-6">
                {seasons.map((s, i) => {
                  const isLatest = i === 0;
                  const milestones = s.milestones?.filter(Boolean) ?? [];
                  return (
                    <div key={`${s.year}-${i}`} className="mb-8 ms-6 sm:ms-8 last:mb-0">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -start-[9px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-[#0C2340] ${
                          isLatest
                            ? "bg-[#DD550C] shadow-lg shadow-[#DD550C]/40"
                            : "bg-[#1a3a5c] border border-[#DD550C]/40"
                        }`}
                      />

                      <Card
                        variant="glass"
                        className={isLatest ? "border-[#DD550C]/30" : ""}
                      >
                        <CardBody>
                          {/* Year badge */}
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[#DD550C]">
                              {s.year}
                            </span>
                            {isLatest && (
                              <span className="rounded-full bg-[#DD550C]/20 px-2.5 py-0.5 text-xs font-semibold text-[#DD550C]">
                                Current
                              </span>
                            )}
                            {milestones.map((m) => (
                              <span
                                key={m}
                                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-300"
                              >
                                {m}
                              </span>
                            ))}
                          </div>

                          {/* Results */}
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-baseline gap-2">
                              <span className="text-base" aria-hidden>
                                🏆
                              </span>
                              <span className="font-semibold text-white">
                                {nameAndTeam(s.champion, s.championTeam)}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-base" aria-hidden>
                                🥈
                              </span>
                              <span className="text-gray-300">
                                {nameAndTeam(s.runnerUp, s.runnerUpTeam)}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-base" aria-hidden>
                                🥉
                              </span>
                              <span className="text-gray-400">
                                {nameAndTeam(s.third, s.thirdTeam)}
                              </span>
                            </div>
                          </div>

                          {s.notes && (
                            <p className="mt-2 text-xs text-gray-500">
                              {s.notes}
                            </p>
                          )}
                        </CardBody>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar: Championship Belt Tracker */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                <Card>
                  <CardHeader
                    title="Championship Belt"
                    description="Title holders in chronological order"
                  />
                  <CardBody>
                    <ol className="space-y-3">
                      {beltTracker.map((reign, i) => (
                        <li key={`${reign.holder}-${reign.from}-${i}`} className="flex items-center gap-3">
                          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#DD550C]/20 font-[family-name:var(--font-heading)] text-xs font-bold text-[#DD550C]">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white text-sm">
                              {reign.holder}
                            </p>
                            <p className="text-xs text-gray-400">
                              {reign.from === reign.to
                                ? String(reign.from)
                                : `${reign.from}–${reign.to}`}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader
                    title="Title Count"
                    description="Championships per manager"
                  />
                  <CardBody>
                    <ul className="space-y-2">
                      {titleCounts.map((t) => (
                        <li key={t.name} className="flex items-center justify-between text-sm">
                          <span className="text-gray-200">{t.name}</span>
                          <div className="flex items-center gap-1.5">
                            <div className="flex gap-0.5">
                              {Array.from({ length: t.count }).map((_, j) => (
                                <span
                                  key={j}
                                  className="inline-block h-2.5 w-2.5 rounded-full bg-[#DD550C]"
                                />
                              ))}
                            </div>
                            <span className="w-4 text-right font-mono text-xs text-gray-400">
                              {t.count}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
