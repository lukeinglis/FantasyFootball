import type { BallotData } from "../ballot-schema";
import { Card, CardHeader, CardBody } from "@/components/Card";

interface BallotConfirmationProps {
  data: BallotData;
  wasUpdate: boolean;
}

function voteLabel(vote: string): string {
  const labels: Record<string, string> = {
    keep: "Keep",
    change: "Change",
    yes: "Yes",
    no: "No",
  };
  return labels[vote] ?? vote;
}

export default function BallotConfirmation({
  data,
  wasUpdate,
}: BallotConfirmationProps) {
  return (
    <Card variant="scoreboard">
      <CardHeader title="Ballot Submitted" />
      <CardBody>
        <div className="space-y-6">
          <div className="text-center">
            <p className="font-[family-name:var(--font-display)] text-2xl text-[#D4A847]">
              Thank you, {data.managerName}!
            </p>
            <p className="mt-2 text-sm text-[rgba(245,240,232,0.7)]">
              {wasUpdate
                ? "Your previous ballot has been updated."
                : "Your ballot has been recorded."}
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-[#8B5E3C]/30 bg-[#1A0F08]/50 p-4 text-sm">
            <h3 className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-wider text-[#D4A847]">
              Your Responses
            </h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-[rgba(245,240,232,0.5)]">Buy-in ($250)</dt>
                <dd className="font-semibold">{voteLabel(data.buyInVote)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[rgba(245,240,232,0.5)]">Keeper rules</dt>
                <dd className="font-semibold">
                  {voteLabel(data.keeperVote)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[rgba(245,240,232,0.5)]">
                  Weekly challenges
                </dt>
                <dd className="font-semibold">
                  {voteLabel(data.challengeVote)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[rgba(245,240,232,0.5)]">
                  Travis Hunter Rule
                </dt>
                <dd className="font-semibold">
                  {voteLabel(data.travisHunterVote)}
                </dd>
              </div>
              {data.draftDates.length > 0 && (
                <div>
                  <dt className="text-[rgba(245,240,232,0.5)]">
                    Draft availability
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {data.draftDates.join(", ")}
                  </dd>
                </div>
              )}
              {data.writeIn && (
                <div>
                  <dt className="text-[rgba(245,240,232,0.5)]">Write-in</dt>
                  <dd className="mt-1 font-semibold">{data.writeIn}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
