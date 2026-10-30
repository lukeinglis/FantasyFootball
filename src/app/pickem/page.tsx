import type { Metadata } from "next";
import { Suspense } from "react";

import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import pickemData from "@/data/pickem.json";
import type { PickemData } from "@/lib/pickem";

import PickemTabs from "./PickemTabs";
import BoardContent from "./BoardContent";
import CardsContent from "./CardsContent";
import AlikeContent from "./AlikeContent";
import SpreadsContent from "./SpreadsContent";
import ScoreboardContent from "./ScoreboardContent";

const data = pickemData as PickemData;

export const metadata: Metadata = {
  title: "Pick'em",
  description: `Week ${data.week} pick'em: every manager's picks and predicted point totals.`,
};

export default function PickemPage() {
  const submitted = data.entries.map((e) => e.name);
  const waitingOn = data.roster.filter((m) => !submitted.includes(m));

  return (
    <>
      <PageHeader
        eyebrow={`Week ${data.week}`}
        pennant={`${data.season} season`}
        title="Pick'em"
        subtitle="Everyone picks all six matchups and predicts the combined score of each. Your tiebreaker is the sum of those six numbers."
      >
        <div className="border border-ink bg-paper px-4 py-3 text-right">
          <p className="font-[family-name:var(--wire-display)] text-[28px] font-extrabold leading-none text-ink">
            {data.entries.length}
            <span className="text-ink-faint">/{data.roster.length}</span>
          </p>
          <p className="mt-1 font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Cards in
          </p>
        </div>
      </PageHeader>

      {waitingOn.length > 0 && (
        <Container className="!pb-0">
          <div className="border-l-2 border-result bg-surface px-4 py-3">
            <p className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.14em] text-result">
              Still waiting on
            </p>
            <p className="mt-1 font-[family-name:var(--wire-body)] text-[15px] text-ink">
              {waitingOn.join(", ")}
            </p>
          </div>
        </Container>
      )}

      <Suspense fallback={null}>
        <PickemTabs
          boardContent={<BoardContent />}
          cardsContent={<CardsContent />}
          alikeContent={<AlikeContent />}
          spreadsContent={<SpreadsContent />}
          scoreboardContent={<ScoreboardContent />}
        />
      </Suspense>
    </>
  );
}
