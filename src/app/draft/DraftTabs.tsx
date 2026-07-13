"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import TabNav from "@/components/TabNav";
import TabErrorBoundary from "@/components/TabErrorBoundary";

const TABS = [
  { id: "board", label: "Board", description: "Current season picks" },
  { id: "history", label: "History", description: "Every pick, every year" },
  { id: "insights", label: "Insights", description: "Draft tendencies & archetypes" },
  { id: "trends", label: "Trends", description: "Position & value analysis" },
];

interface DraftTabsProps {
  boardContent: ReactNode;
  historyContent: ReactNode;
  insightsContent: ReactNode;
  trendsContent: ReactNode;
}

export default function DraftTabs({
  boardContent,
  historyContent,
  insightsContent,
  trendsContent,
}: DraftTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = searchParams.get("tab") || "board";
  const validTab = TABS.some((t) => t.id === activeTab) ? activeTab : "board";

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
      <TabNav tabs={TABS} activeTab={validTab} onTabChange={handleTabChange} />
      <div key={validTab} className="animate-fade-in-up">
        {validTab === "board" && <TabErrorBoundary fallbackLabel="Draft board unavailable">{boardContent}</TabErrorBoundary>}
        {validTab === "history" && <TabErrorBoundary fallbackLabel="Draft history unavailable">{historyContent}</TabErrorBoundary>}
        {validTab === "insights" && <TabErrorBoundary fallbackLabel="Draft insights unavailable">{insightsContent}</TabErrorBoundary>}
        {validTab === "trends" && <TabErrorBoundary fallbackLabel="Draft trends unavailable">{trendsContent}</TabErrorBoundary>}
      </div>
    </>
  );
}
