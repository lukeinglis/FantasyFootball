import type { Metadata } from "next";
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import DraftTabs from "./DraftTabs";
import DraftBoardContent from "./DraftBoardContent";
import DraftHistoryContent from "./DraftHistoryContent";
import DraftInsightsContent from "./DraftInsightsContent";
import DraftTrendsContent from "./DraftTrendsContent";

export const metadata: Metadata = {
  title: "Draft",
  description: "The Greybushes & Chili Dogs draft board, history, insights, and trends.",
};

export const dynamic = "force-dynamic";

export default function DraftPage() {
  return (
    <>
      <PageHeader
        eyebrow="Draft"
        title="Draft Central"
        subtitle="Every pick, every regret, every trend."
      />
      <Suspense>
        <DraftTabs
          boardContent={<DraftBoardContent />}
          historyContent={<DraftHistoryContent />}
          insightsContent={<DraftInsightsContent />}
          trendsContent={<DraftTrendsContent />}
        />
      </Suspense>
    </>
  );
}
