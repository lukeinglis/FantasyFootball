import type { Metadata } from "next";
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import RecordsTabs from "./RecordsTabs";
import RecordsContent from "./RecordsContent";
import AwardsContent from "./AwardsContent";
import WallOfShameContent from "./WallOfShameContent";

export const metadata: Metadata = {
  title: "Record Book",
  description:
    "All-time records, awards, and the wall of shame from Greybushes & Chili Dogs.",
};

export default function RecordsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Hall of Records"
        title="Record Book"
        subtitle="Records, awards, and the consequences of finishing last."
      />
      <Suspense>
        <RecordsTabs
          recordsContent={<RecordsContent />}
          awardsContent={<AwardsContent />}
          shameContent={<WallOfShameContent />}
        />
      </Suspense>
    </>
  );
}
