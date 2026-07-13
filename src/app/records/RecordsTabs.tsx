"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import TabNav from "@/components/TabNav";

const TABS = [
  { id: "records", label: "Records" },
  { id: "awards", label: "Awards" },
  { id: "hall-of-shame", label: "Hall of Shame" },
];

interface RecordsTabsProps {
  recordsContent: ReactNode;
  awardsContent: ReactNode;
  shameContent: ReactNode;
}

export default function RecordsTabs({
  recordsContent,
  awardsContent,
  shameContent,
}: RecordsTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = searchParams.get("tab") || "records";
  const validTab = TABS.some((t) => t.id === activeTab) ? activeTab : "records";

  const handleTabChange = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === "records") {
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
        {validTab === "records" && recordsContent}
        {validTab === "awards" && awardsContent}
        {validTab === "hall-of-shame" && shameContent}
      </div>
    </>
  );
}
