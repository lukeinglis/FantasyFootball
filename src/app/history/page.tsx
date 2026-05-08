import type { Metadata } from "next";
import historyData from "@/data/history.json";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardBody } from "@/components/Card";
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
}

interface HistoryFile {
  seasons: SeasonRecord[];
}

const data = historyData as HistoryFile;

function nameAndTeam(name?: string, team?: string): string {
  if (name && team) return `${name} (${team})`;
  return name || team || "—";
}

function getTitleCounts(seasons: SeasonRecord[]): { name: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const s of seasons) {
    if (s.champion) counts[s.champion] = (counts[s.champion] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export default function HistoryPage() {
  const seasons = [...data.seasons].sort((a, b) => {
    const ay = Number(a.year) || 0;
    const by = Number(b.year) || 0;
    return by - ay;
  });

  const titleCounts = getTitleCounts(seasons);
  const uniqueChamps = titleCounts.length;

  return (
    <>
      <PageHeader
        eyebrow="The Annals"
        title="League History"
        subtitle={`${seasons.length} seasons. ${uniqueChamps} unique champions. No repeat winners.`}
      />
      <Container>
        {/* Dynasty Summary */}
        {seasons.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Card variant="glass">
              <CardBody>
                <div className="text-center">
                  <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Seasons</p>
                  <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-gradient">{seasons.length}</p>
                </div>
              </CardBody>
            </Card>
            <Card variant="glass">
              <CardBody>
                <div className="text-center">
                  <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Unique Champions</p>
                  <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-gradient">{uniqueChamps}</p>
                </div>
              </CardBody>
            </Card>
            <Card variant="glass">
              <CardBody>
                <div className="text-center">
                  <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Defending Champ</p>
                  <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-gradient">{seasons[0]?.champion || "—"}</p>
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
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0C2340] text-xs uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-3 py-3">Year</th>
                    <th className="px-3 py-3">Champion</th>
                    <th className="px-3 py-3">Runner-Up</th>
                    <th className="px-3 py-3 hidden md:table-cell">Third</th>
                    <th className="px-3 py-3 hidden lg:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {seasons.map((s, i) => (
                    <tr
                      key={`${s.year}-${i}`}
                      className={`hover:bg-[#112d4e] transition-colors ${
                        i === 0 ? "bg-[#DD550C]/5" : "bg-[#112d4e]/40"
                      }`}
                    >
                      <td className="px-3 py-3 font-[family-name:var(--font-heading)] font-mono text-lg font-bold text-[#DD550C]">
                        {s.year}
                      </td>
                      <td className="px-3 py-3">
                        <span className="mr-1.5 text-base" aria-hidden>
                          {i === 0 ? "🏆" : "🥇"}
                        </span>
                        <span className="font-semibold text-white">
                          {nameAndTeam(s.champion, s.championTeam)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-300">
                        <span className="mr-1.5 text-base" aria-hidden>
                          🥈
                        </span>
                        {nameAndTeam(s.runnerUp, s.runnerUpTeam)}
                      </td>
                      <td className="px-3 py-3 text-gray-400 hidden md:table-cell">
                        <span className="mr-1.5 text-base" aria-hidden>
                          🥉
                        </span>
                        {nameAndTeam(s.third, s.thirdTeam)}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500 hidden lg:table-cell">
                        {s.notes || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </Container>
    </>
  );
}
