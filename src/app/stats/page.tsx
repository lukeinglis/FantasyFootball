import type { Metadata } from "next";
import { fetchStandings, fetchSettings, fetchScoreboard } from "@/lib/server-data";
import type { Scoreboard } from "@/lib/yahoo/types";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { LAST_COMPLETED_SEASON } from "@/lib/season";
import NotConnected, { ApiError } from "@/components/NotConnected";
import OffseasonState from "@/components/OffseasonState";
import StatsTabs from "./StatsTabs";
import StatsContent from "./StatsContent";
import PowerRankingsContent from "./PowerRankingsContent";

export const metadata: Metadata = {
  title: "Stats & Rankings",
  description: "League analytics, superlatives, stat breakdowns, and composite power rankings.",
};

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const [standingsResult, settingsResult] = await Promise.all([
    fetchStandings(),
    fetchSettings(),
  ]);

  const currentWeek = settingsResult.ok ? settingsResult.data.currentWeek : 0;
  const weeksToFetch = Math.max(0, currentWeek - 1);

  const scoreboards: Scoreboard[] = [];
  if (weeksToFetch > 0) {
    const fetches = Array.from({ length: weeksToFetch }, (_, i) =>
      fetchScoreboard(i + 1)
    );
    const results = await Promise.all(fetches);
    for (const r of results) {
      if (r.ok) scoreboards.push(r.data);
    }
  }

  if (!standingsResult.ok) {
    return (
      <>
        <PageHeader
          eyebrow={`${LAST_COMPLETED_SEASON} season`}
          title="Stats & Rankings"
          subtitle="The numbers behind the madness. Superlatives, rankings, and bragging rights."
        />
        <Container>
          {standingsResult.notConfigured ? (
            <NotConnected resource="stats" />
          ) : standingsResult.offseason ? (
            <OffseasonState resource="stats" />
          ) : (
            <ApiError resource="stats" detail={standingsResult.message} />
          )}
        </Container>
      </>
    );
  }

  const teams = standingsResult.data.teams;

  return (
    <>
      <PageHeader
        eyebrow={`${LAST_COMPLETED_SEASON} season`}
        title="Stats & Rankings"
        subtitle="The numbers behind the madness. Superlatives, rankings, and bragging rights."
      />
      <Container>
        <StatsTabs
          statsContent={
            <StatsContent teams={teams} scoreboards={scoreboards} />
          }
          powerRankingsContent={
            <PowerRankingsContent
              teams={teams}
              scoreboards={scoreboards}
              currentWeek={currentWeek}
            />
          }
        />
      </Container>
    </>
  );
}
