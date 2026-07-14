"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import TabNav from "@/components/TabNav";
import TabErrorBoundary from "@/components/TabErrorBoundary";

const TABS = [
  { id: "stats", label: "Stats", description: "Season superlatives and scoring leaders" },
  { id: "power-rankings", label: "Power Rankings", description: "Composite power score ranking" },
];

interface StatsTabsProps {
  statsContent: ReactNode;
  powerRankingsContent: ReactNode;
}

export default function StatsTabs({
  statsContent,
  powerRankingsContent,
}: StatsTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = searchParams.get("tab") || "stats";
  const validTab = TABS.some((t) => t.id === activeTab) ? activeTab : "stats";

  const handleTabChange = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === "stats") {
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
      <TabNav tabs={TABS} activeTab={validTab} onTabChange={handleTabChange} />
      <div key={validTab} className="animate-fade-in-up">
        {validTab === "stats" && (
          <TabErrorBoundary fallbackLabel="Stats unavailable">
            {statsContent}
          </TabErrorBoundary>
        )}
        {validTab === "power-rankings" && (
          <TabErrorBoundary fallbackLabel="Power rankings unavailable">
            {powerRankingsContent}
          </TabErrorBoundary>
        )}
      </div>
    </>
  );
}
