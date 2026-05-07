import type { Metadata } from "next";
import recordsData from "@/data/records.json";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardHeader, CardBody } from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import { formatPoints } from "@/lib/format";

export const metadata: Metadata = {
  title: "Record Book",
  description:
    "All-time records and legendary performances in Greybushes & Chili Dogs history.",
};

interface SingleRecord {
  holder?: string;
  value?: number | string;
  week?: string;
  season?: string;
  description?: string;
}

interface MatchupRecord {
  winner?: string;
  loser?: string;
  margin?: number;
  score?: string;
  week?: string;
  season?: string;
  description?: string;
}

type RecordEntry = SingleRecord | MatchupRecord;

function isPopulated(r: RecordEntry): boolean {
  if ("holder" in r && r.holder) return true;
  if ("winner" in r && r.winner) return true;
  return false;
}

function formatValue(v: number | string | undefined): string {
  if (v === undefined || v === null || v === "" || v === 0) return "TBD";
  if (typeof v === "number") return formatPoints(v, 1);
  return String(v);
}

const data = recordsData as {
  allTime: Record<string, RecordEntry>;
  notes?: string;
};

const RECORD_LABELS: Record<string, string> = {
  mostPointsSeason: "Most Points (Season)",
  mostPointsWeek: "Highest Single-Week Score",
  fewestPointsWeek: "Lowest Single-Week Score",
  longestWinStreak: "Longest Win Streak",
  longestLosingStreak: "Longest Losing Streak",
  bestRecord: "Best Regular-Season Record",
  worstRecord: "Worst Regular-Season Record",
  biggestBlowout: "Biggest Blowout",
  closestGame: "Closest Game",
};

const RECORD_ICONS: Record<string, string> = {
  mostPointsSeason: "🔥",
  mostPointsWeek: "💥",
  fewestPointsWeek: "😬",
  longestWinStreak: "🏆",
  longestLosingStreak: "📉",
  bestRecord: "⭐",
  worstRecord: "💀",
  biggestBlowout: "🔨",
  closestGame: "😰",
};

export default function RecordsPage() {
  const entries = Object.entries(data.allTime);
  const populated = entries.filter(([, r]) => isPopulated(r));

  return (
    <>
      <PageHeader
        eyebrow="Hall of Records"
        title="Record Book"
        subtitle="The greatest (and worst) performances in league history. Legends are made here."
      />
      <Container>
        {populated.length === 0 ? (
          <EmptyState
            icon={<span>📖</span>}
            title="Records coming soon"
            description="Once we dig through the archives, the all-time records will be enshrined here for eternity."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map(([key, record]) => {
              const label = RECORD_LABELS[key] || key;
              const icon = RECORD_ICONS[key] || "🏅";
              const pop = isPopulated(record);

              if ("winner" in record) {
                return (
                  <Card key={key}>
                    <CardBody>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl" aria-hidden>
                          {icon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-widest text-[#f0c75e]/80">
                            {label}
                          </p>
                          {pop ? (
                            <>
                              <p className="mt-1 text-lg font-bold text-white">
                                {record.winner} vs {record.loser}
                              </p>
                              <p className="mt-0.5 font-mono text-sm text-gray-300">
                                {record.score || formatValue(record.margin)}{" "}
                                {record.season &&
                                  `· ${record.season}`}{" "}
                                {record.week && `Wk ${record.week}`}
                              </p>
                            </>
                          ) : (
                            <p className="mt-1 text-sm text-gray-500 italic">
                              Not yet recorded
                            </p>
                          )}
                          {record.description && (
                            <p className="mt-1 text-xs text-gray-500">
                              {record.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              }

              const sr = record as SingleRecord;
              return (
                <Card key={key}>
                  <CardBody>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl" aria-hidden>
                        {icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#f0c75e]/80">
                          {label}
                        </p>
                        {pop ? (
                          <>
                            <p className="mt-1 text-lg font-bold text-white">
                              {sr.holder}
                            </p>
                            <p className="mt-0.5 font-mono text-sm text-[#f0c75e]">
                              {formatValue(sr.value)}{" "}
                              {sr.season && `· ${sr.season}`}{" "}
                              {sr.week && `Wk ${sr.week}`}
                            </p>
                          </>
                        ) : (
                          <p className="mt-1 text-sm text-gray-500 italic">
                            Not yet recorded
                          </p>
                        )}
                        {sr.description && (
                          <p className="mt-1 text-xs text-gray-500">
                            {sr.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {data.notes && (
          <p className="mt-6 text-center text-xs text-gray-500 italic">
            {data.notes}
          </p>
        )}
      </Container>
    </>
  );
}
