import type { Metadata } from "next";
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import GamesTabs from "./GamesTabs";

export const metadata: Metadata = {
  title: "Arcade",
  description: "Mini-games for Greybushes & Chili Dogs",
};

export default function GamesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Game Zone"
        title="Arcade"
        subtitle="Play for glory. Sign in to save your score to the leaderboard."
      />
      <Suspense>
        <GamesTabs />
      </Suspense>
    </>
  );
}
