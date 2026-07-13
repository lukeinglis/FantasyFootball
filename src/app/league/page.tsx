import type { Metadata } from "next";
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import LeagueTabs from "./LeagueTabs";
import RulesContent from "./RulesContent";
import PayoutsContent from "./PayoutsContent";

export const metadata: Metadata = {
  title: "League Info",
  description: "Rules, payouts, and everything you need to know about Greybushes & Chili Dogs.",
};

export default function LeaguePage() {
  return (
    <>
      <PageHeader
        eyebrow="The Fine Print"
        title="League Info"
        subtitle="Rules, payouts, and everything the commish will hold over your head."
      />
      <Suspense>
        <LeagueTabs
          rulesContent={<RulesContent />}
          payoutsContent={<PayoutsContent />}
        />
      </Suspense>
    </>
  );
}
