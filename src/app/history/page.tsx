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
            <Card variant="scoreboard">
              <CardBody>
                <div className="text-center">
                  <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                    Seasons
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-record">
                    {seasons.length}
                  </p>
                </div>
              </CardBody>
            </Card>
            <Card variant="scoreboard">
              <CardBody>
                <div className="text-center">
                  <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                    Unique Champions
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-record">
                    {uniqueChamps}
                  </p>
                </div>
              </CardBody>
            </Card>
            <Card variant="scoreboard">
              <CardBody>
                <div className="text-center">
                  <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                    Defending Champ
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-record">
                    {seasons[0]?.champion || "—"}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {seasons.length === 0 ? (
          <EmptyState
            title="Seasons coming soon"
            description="We're still digging through old screenshots and group chats. Past champions will be added as we recover the receipts."
          />
        ) : (
          <div className="grid gap-10 lg:grid-cols-3">
            {/* Timeline: 2 columns on large screens */}
            <div className="lg:col-span-2">
              {/* The spine is chrome: it tells you these eleven cards are one
                  sequence and nothing more. A gold rule down the page gave it
                  the weight of a finding. */}
              <div data-testid="history-timeline" className="relative border-s border-rule ms-4 sm:ms-6">
                {seasons.map((s, i) => {
                  const isLatest = i === 0;
                  const milestones = s.milestones?.filter(Boolean) ?? [];
                  return (
                    <div key={`${s.year}-${i}`} data-testid="season-card" className="mb-8 ms-6 sm:ms-8 last:mb-0">
                      {/* Timeline marker. The ring has to match the page
                          background so it punches a gap in the spine rule
                          behind it; anything else reads as a coloured chip. */}
                      <span
                        className={`absolute -start-[7px] mt-1.5 h-3 w-3 ring-4 ring-paper ${
                          isLatest ? "bg-result" : "bg-ink-faint"
                        }`}
                      />

                      <Card
                        variant="scoreboard"
                        className={isLatest ? "border-result/30" : ""}
                      >
                        <CardBody>
                          {/* Year badge */}
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            {/* A year is a label, not a result. Red on both the
                                year and the "1st" line put the same emphasis on
                                the index and the finding it indexes. */}
                            <span data-testid="season-year" className="font-[family-name:var(--wire-display)] text-2xl font-extrabold tabular-nums text-ink">
                              {s.year}
                            </span>
                            {isLatest && (
                              <span className="bg-result/20 px-2.5 py-0.5 text-xs font-semibold text-result">
                                Current
                              </span>
                            )}
                            {milestones.map((m) => (
                              <span
                                key={m}
                                className="border border-rule bg-paper px-2.5 py-0.5 text-xs text-ink-soft"
                              >
                                {m}
                              </span>
                            ))}
                          </div>

                          {/* Results */}
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-baseline gap-2">
                              <span className="w-8 flex-shrink-0 font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.1em] text-result">
                                1st
                              </span>
                              <span className="font-semibold text-ink">
                                {nameAndTeam(s.champion, s.championTeam)}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="w-8 flex-shrink-0 font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.1em] text-ink-muted">
                                2nd
                              </span>
                              <span className="text-ink-soft">
                                {nameAndTeam(s.runnerUp, s.runnerUpTeam)}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="w-8 flex-shrink-0 font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                                3rd
                              </span>
                              <span className="text-ink-muted">
                                {nameAndTeam(s.third, s.thirdTeam)}
                              </span>
                            </div>
                          </div>

                          {s.notes && (
                            <p className="mt-2 text-xs text-ink-muted">
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
                <div data-testid="belt-tracker">
                <Card>
                  <CardHeader
                    title="Championship Belt"
                    description="Title holders in chronological order"
                  />
                  <CardBody>
                    <ol className="space-y-3">
                      {beltTracker.map((reign, i) => (
                        <li key={`${reign.holder}-${reign.from}-${i}`} className="flex items-center gap-3">
                          {/* Sequence numbers, matching the rank badges used on
                              every other ordered list on the site. */}
                          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center bg-ink font-[family-name:var(--wire-mono)] text-xs font-bold tabular-nums text-white">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink text-sm">
                              {reign.holder}
                            </p>
                            <p className="text-xs text-ink-muted">
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
                </div>

                <div data-testid="title-count">
                <Card>
                  <CardHeader
                    title="Title Count"
                    description="Championships per manager"
                  />
                  <CardBody>
                    <ul className="space-y-2">
                      {titleCounts.map((t) => (
                        <li key={t.name} className="flex items-center justify-between text-sm">
                          <span className="text-ink-soft">{t.name}</span>
                          <div className="flex items-center gap-1.5">
                            <div className="flex gap-0.5">
                              {Array.from({ length: t.count }).map((_, j) => (
                                <span
                                  key={j}
                                  className="inline-block h-2.5 w-2.5 bg-result"
                                />
                              ))}
                            </div>
                            <span className="w-4 text-right font-mono text-xs text-ink-muted">
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
          </div>
        )}
      </Container>
    </>
  );
}
