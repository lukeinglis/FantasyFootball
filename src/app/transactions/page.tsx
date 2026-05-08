import type { Metadata } from "next";
import { fetchTransactions } from "@/lib/server-data";

import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import NotConnected, { ApiError } from "@/components/NotConnected";
import OffseasonState from "@/components/OffseasonState";
import TransactionList from "@/components/transactions/TransactionList";

export const metadata: Metadata = {
  title: "Transactions",
  description: "Adds, drops, and trades across the league.",
};

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const result = await fetchTransactions();

  return (
    <>
      <PageHeader
        eyebrow="Activity"
        title="Transactions"
        subtitle="Every desperate waiver claim and dump-truck trade, in chronological order."
      />
      <Container>
        {!result.ok ? (
          result.notConfigured ? (
            <NotConnected resource="transactions" />
          ) : result.offseason ? (
            <OffseasonState resource="transactions" />
          ) : (
            <ApiError resource="transactions" detail={result.message} />
          )
        ) : (
          <TransactionList transactions={result.data} />
        )}
      </Container>
    </>
  );
}
