"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import dynamic from "next/dynamic";
import TabNav from "@/components/TabNav";
import TabErrorBoundary from "@/components/TabErrorBoundary";

const BreakawaySection = dynamic(
  () => import("@/components/home/BreakawaySection"),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center">
        <div className="h-[400px] w-full max-w-[400px] animate-pulse rounded-xl bg-white/5" />
      </div>
    ),
  },
);

const FieldGoalSection = dynamic(
  () => import("@/components/home/FieldGoalSection"),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center">
        <div className="h-[400px] w-full max-w-[500px] animate-pulse rounded-xl bg-white/5" />
      </div>
    ),
  },
);

const TABS = [
  { id: "breakaway", label: "Breakaway", description: "Dodge tacklers and score" },
  { id: "fieldgoal", label: "Field Goal Frenzy", description: "Kick for glory" },
];

export default function GamesTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = searchParams.get("tab") || "breakaway";
  const validTab = TABS.some((t) => t.id === activeTab) ? activeTab : "breakaway";

  const handleTabChange = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === "breakaway") {
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
        {validTab === "breakaway" && (
          <TabErrorBoundary fallbackLabel="Breakaway unavailable">
            <BreakawaySection />
          </TabErrorBoundary>
        )}
        {validTab === "fieldgoal" && (
          <TabErrorBoundary fallbackLabel="Field Goal Frenzy unavailable">
            <FieldGoalSection />
          </TabErrorBoundary>
        )}
      </div>
    </>
  );
}
