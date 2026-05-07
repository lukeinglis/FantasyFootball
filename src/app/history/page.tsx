import type { Metadata } from "next";
import historyData from "@/data/history.json";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card } from "@/components/Card";
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

export default function HistoryPage() {
  const seasons = [...data.seasons].sort((a, b) => {
    const ay = Number(a.year) || 0;
    const by = Number(b.year) || 0;
    return by - ay;
  });

  return (
    <>
      <PageHeader
        eyebrow="The Annals"
        title="League History"
        subtitle="Every champion. Every runner-up. Every year someone wouldn't shut up about it."
      />
      <Container>
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
                <thead className="bg-[#0f1f3a] text-xs uppercase tracking-wider text-gray-400">
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
                      className="bg-[#14284a]/40 hover:bg-[#14284a]"
                    >
                      <td className="px-3 py-3 font-mono text-[#f0c75e]">
                        {s.year}
                      </td>
                      <td className="px-3 py-3">
                        <span className="mr-1.5 text-base" aria-hidden>
                          🥇
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
