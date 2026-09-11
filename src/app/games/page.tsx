import type { Metadata } from "next";
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import GamesTabs from "./GamesTabs";

export const metadata: Metadata = {
  title: "Arcade",
  description: "Mini-games for Greybushes & Chili Dogs. Play Breakaway and Field Goal Frenzy.",
};

export default function GamesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Game Zone"
        title="Arcade"
        subtitle="Play for glory. Sign in to save your score to the leaderboard."
      />
      <Container>
        {/* GamesTabs reads the active game from ?tab, so it needs a boundary to
            prerender. It uses the shared tab strip that Draft and League use,
            rather than the second bespoke header and button set that used to
            repeat "Game Zone" and the subtitle directly under this header. */}
        <Suspense
          fallback={<div className="h-[480px] animate-pulse bg-surface" />}
        >
          <GamesTabs />
        </Suspense>
      </Container>
    </>
  );
}
