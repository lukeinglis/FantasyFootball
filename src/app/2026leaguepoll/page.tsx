import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import BallotForm from "./components/BallotForm";

export const metadata: Metadata = {
  title: "2026 Owners' Ballot",
  description:
    "Cast your vote on buy-in, draft dates, keeper rules, weekly challenges, and more for the 2026 season.",
};

export default function LeaguePollPage() {
  return (
    <>
      <PageHeader
        title="2026 Owners' Ballot"
        pennant="Greybushes & Chili Dogs"
        subtitle="Cast your vote on the 2026 season rules and schedule"
      />
      <Container className="max-w-2xl">
        <BallotForm />
      </Container>
    </>
  );
}
