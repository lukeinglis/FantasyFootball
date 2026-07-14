import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import GameZone from "@/components/home/GameZone";

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
        <GameZone />
      </Container>
    </>
  );
}
