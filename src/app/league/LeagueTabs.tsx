"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import TabNav from "@/components/TabNav";
import TabErrorBoundary from "@/components/TabErrorBoundary";

const TABS = [
  { id: "rules", label: "Rules", description: "League bylaws" },
  { id: "payouts", label: "Payouts", description: "Prize structure" },
];

interface LeagueTabsProps {
  rulesContent: ReactNode;
  payoutsContent: ReactNode;
}

export default function LeagueTabs({
  rulesContent,
  payoutsContent,
}: LeagueTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = searchParams.get("tab") || "rules";
  const validTab = TABS.some((t) => t.id === activeTab) ? activeTab : "rules";

  const handleTabChange = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === "rules") {
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
        {validTab === "rules" && <TabErrorBoundary fallbackLabel="Rules unavailable">{rulesContent}</TabErrorBoundary>}
        {validTab === "payouts" && <TabErrorBoundary fallbackLabel="Payouts unavailable">{payoutsContent}</TabErrorBoundary>}
      </div>
    </>
  );
}
