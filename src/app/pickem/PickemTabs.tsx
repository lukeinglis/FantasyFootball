"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import TabNav from "@/components/TabNav";
import TabErrorBoundary from "@/components/TabErrorBoundary";

const TABS = [
  {
    id: "board",
    label: "The Board",
    description: "How the room split on each game",
  },
  {
    id: "cards",
    label: "Every Card",
    description: "All picks and predicted totals, manager by manager",
  },
  {
    id: "alike",
    label: "Who Thinks Alike",
    description: "How many games each pair picked the same way",
  },
  {
    id: "spreads",
    label: "Spreads",
    description: "The range of predicted scores for each game",
  },
  {
    id: "scoreboard",
    label: "Scoreboard",
    description: "Who is winning as the games go final",
  },
];

interface PickemTabsProps {
  boardContent: ReactNode;
  cardsContent: ReactNode;
  alikeContent: ReactNode;
  spreadsContent: ReactNode;
  scoreboardContent: ReactNode;
}

export default function PickemTabs({
  boardContent,
  cardsContent,
  alikeContent,
  spreadsContent,
  scoreboardContent,
}: PickemTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const requested = searchParams.get("tab") || "board";
  const activeTab = TABS.some((t) => t.id === requested) ? requested : "board";

  const handleTabChange = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === "board") {
        params.delete("tab");
      } else {
        params.set("tab", id);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return (
    <>
      <TabNav tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      <div key={activeTab} className="animate-fade-in-up">
        {activeTab === "board" && (
          <TabErrorBoundary fallbackLabel="Board unavailable">
            {boardContent}
          </TabErrorBoundary>
        )}
        {activeTab === "cards" && (
          <TabErrorBoundary fallbackLabel="Cards unavailable">
            {cardsContent}
          </TabErrorBoundary>
        )}
        {activeTab === "alike" && (
          <TabErrorBoundary fallbackLabel="Agreement grid unavailable">
            {alikeContent}
          </TabErrorBoundary>
        )}
        {activeTab === "spreads" && (
          <TabErrorBoundary fallbackLabel="Spreads unavailable">
            {spreadsContent}
          </TabErrorBoundary>
        )}
        {activeTab === "scoreboard" && (
          <TabErrorBoundary fallbackLabel="Scoreboard unavailable">
            {scoreboardContent}
          </TabErrorBoundary>
        )}
      </div>
    </>
  );
}
