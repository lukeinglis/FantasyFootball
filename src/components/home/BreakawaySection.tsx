"use client";

import dynamic from "next/dynamic";

const BreakawayGame = dynamic(() => import("@/components/BreakawayGame"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center">
      <div className="h-[400px] w-full max-w-[400px] animate-pulse bg-paper" />
    </div>
  ),
});

/**
 * No heading here. The page header says "Arcade", the tab says "Breakaway" and
 * the game's own start screen says it a third time; the section used to add a
 * fourth. It renders the game and nothing else, matching FieldGoalSection.
 */
export default function BreakawaySection() {
  return <BreakawayGame />;
}
