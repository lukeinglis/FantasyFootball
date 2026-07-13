"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import TabNav from "@/components/TabNav";

const TABS = [
  { id: "board", label: "Board" },
  { id: "history", label: "History" },
  { id: "insights", label: "Insights" },
  { id: "trends", label: "Trends" },
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
      <div>
        {validTab === "board" && boardContent}
        {validTab === "history" && historyContent}
        {validTab === "insights" && insightsContent}
        {validTab === "trends" && trendsContent}
      </div>
    </>
  );
}
