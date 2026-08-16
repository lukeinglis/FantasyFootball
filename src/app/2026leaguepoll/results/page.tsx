import type { Metadata } from "next";
import { kv } from "@vercel/kv";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardHeader, CardBody } from "@/components/Card";
import members from "@/data/members.json";

export const metadata: Metadata = {
  title: "2026 Poll Results",
  description: "Commissioner view of the 2026 league poll results.",
};

export const dynamic = "force-dynamic";

interface Submission {
  managerName: string;
  buyInVote: string;
  keeperVote: string;
  challengeVote: string;
  travisHunterVote: string;
  draftDates: string[];
  draftNotes: string;
  writeIn: string;
  submittedAt: string;
}

function tally(submissions: Submission[], field: keyof Submission) {
  const counts: Record<string, number> = {};
  for (const s of submissions) {
    const val = s[field];
    if (typeof val === "string" && val) {
      counts[val] = (counts[val] ?? 0) + 1;
    }
  }
  return counts;
}

export default async function ResultsPage() {
  let submissions: Submission[] = [];

  try {
    const keys = await kv.keys("poll:2026:*");
    if (keys.length > 0) {
      const values = await Promise.all(
        keys.map((key) => kv.get<string>(key))
      );
      submissions = values
        .filter((v): v is string => v !== null)
        .map((v) => {
          try {
            return typeof v === "string" ? JSON.parse(v) : v;
          } catch {
            return null;
          }
        })
        .filter((v): v is Submission => v !== null);
    }
  } catch {
    // KV unavailable in dev
  }

  const submitted = submissions.map((s) => s.managerName);
  const notSubmitted = members.active
    .map((m) => m.name)
    .filter((name) => !submitted.some((s) => s.toLowerCase() === name.toLowerCase()));

  const buyInTally = tally(submissions, "buyInVote");
  const keeperTally = tally(submissions, "keeperVote");
  const challengeTally = tally(submissions, "challengeVote");
  const hunterTally = tally(submissions, "travisHunterVote");

  const dateCounts: Record<string, number> = {};
  for (const s of submissions) {
    for (const d of s.draftDates) {
      dateCounts[d] = (dateCounts[d] ?? 0) + 1;
    }
  }

  const writeIns = submissions
    .filter((s) => s.writeIn)
    .map((s) => ({ name: s.managerName, text: s.writeIn }));

  return (
    <>
      <PageHeader
        title="Poll Results"
        pennant="Commissioner View"
        subtitle={`${submissions.length} of ${members.active.length} managers have submitted`}
      />
      <Container className="max-w-3xl space-y-6">
        {/* Submission Status */}
        <Card variant="scoreboard">
          <CardHeader title="Submissions" />
          <CardBody>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-[family-name:var(--font-heading)] text-xs uppercase tracking-wider text-[#D4A847]">
                  Submitted ({submitted.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {submitted.length > 0
                    ? submitted.map((name) => (
                        <span
                          key={name}
                          className="rounded-full bg-[#2D8C3C]/50 px-3 py-1 text-sm text-[#F5F0E8]"
                        >
                          {name}
                        </span>
                      ))
                    : <span className="text-sm text-[rgba(245,240,232,0.5)]">No submissions yet</span>}
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-[family-name:var(--font-heading)] text-xs uppercase tracking-wider text-[#D4A847]">
                  Pending ({notSubmitted.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {notSubmitted.map((name) => (
                    <span
                      key={name}
                      className="rounded-full bg-[#8B5E3C]/30 px-3 py-1 text-sm text-[rgba(245,240,232,0.5)]"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Vote Tallies */}
        <Card variant="scoreboard">
          <CardHeader title="Vote Tallies" />
          <CardBody>
            <div className="space-y-4">
              <TallyRow
                label="Buy-in ($250)"
                counts={buyInTally}
                labels={{ keep: "Keep", change: "Change" }}
              />
              <TallyRow
                label="Keeper rules"
                counts={keeperTally}
                labels={{ keep: "Keep", change: "Change" }}
              />
              <TallyRow
                label="Weekly challenges"
                counts={challengeTally}
                labels={{ keep: "Keep", change: "Change" }}
              />
              <TallyRow
                label="Travis Hunter Rule"
                counts={hunterTally}
                labels={{ yes: "Yes", no: "No" }}
              />
            </div>
          </CardBody>
        </Card>

        {/* Draft Availability */}
        <Card variant="scoreboard">
          <CardHeader title="Draft Availability" />
          <CardBody>
            {Object.keys(dateCounts).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(dateCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([date, count]) => (
                    <div
                      key={date}
                      className="flex items-center justify-between rounded-lg border border-[#8B5E3C]/20 bg-[#1A0F08]/30 px-4 py-3"
                    >
                      <span className="text-sm text-[#F5F0E8]">{date}</span>
                      <span className="font-semibold text-[#D4A847]">
                        {count} available
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-[rgba(245,240,232,0.5)]">
                No availability data yet
              </p>
            )}
          </CardBody>
        </Card>

        {/* Write-Ins */}
        <Card variant="scoreboard">
          <CardHeader title="Write-In Responses" />
          <CardBody>
            {writeIns.length > 0 ? (
              <div className="space-y-4">
                {writeIns.map(({ name, text }) => (
                  <div
                    key={name}
                    className="rounded-lg border border-[#8B5E3C]/20 bg-[#1A0F08]/30 p-4"
                  >
                    <p className="mb-1 font-[family-name:var(--font-heading)] text-xs uppercase tracking-wider text-[#D4A847]">
                      {name}
                    </p>
                    <p className="text-sm text-[#F5F0E8] whitespace-pre-wrap">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[rgba(245,240,232,0.5)]">
                No write-in responses yet
              </p>
            )}
          </CardBody>
        </Card>
      </Container>
    </>
  );
}

function TallyRow({
  label,
  counts,
  labels,
}: {
  label: string;
  counts: Record<string, number>;
  labels: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#8B5E3C]/15 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-semibold text-[#F5F0E8]">{label}</span>
      <div className="flex gap-4 text-sm">
        {Object.entries(labels).map(([key, displayLabel]) => (
          <span key={key} className="text-[rgba(245,240,232,0.7)]">
            {displayLabel}:{" "}
            <span className="font-semibold text-[#D4A847]">
              {counts[key] ?? 0}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
