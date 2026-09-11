"use client";

import { useMemo, useState } from "react";
import type { Transaction } from "@/lib/yahoo/types";
import { formatTimestamp, titleCase } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/Card";
import EmptyState from "@/components/EmptyState";

type FilterKey = "all" | "add" | "drop" | "trade";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "add", label: "Adds" },
  { key: "drop", label: "Drops" },
  { key: "trade", label: "Trades" },
];

function transactionMatches(t: Transaction, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "trade") return t.type === "trade";
  if (filter === "add")
    return (
      t.type === "add" ||
      t.type === "add/drop" ||
      t.players.some((p) => p.transactionType === "add")
    );
  if (filter === "drop")
    return (
      t.type === "drop" ||
      t.type === "add/drop" ||
      t.players.some((p) => p.transactionType === "drop")
    );
  return false;
}

function typeBadge(type: Transaction["type"]): string {
  switch (type) {
    case "trade":
      return "bg-history/10 text-history border-history/30";
    case "add":
      return "bg-money/10 text-money border-money/30";
    case "drop":
      return "bg-result/10 text-result border-result/30";
    case "add/drop":
      return "bg-paper text-ink border-ink";
    default:
      return "bg-paper text-ink-soft border-rule";
  }
}

export default function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(
    () => transactions.filter((t) => transactionMatches(t, filter)),
    [transactions, filter]
  );

  return (
    <Card>
      <CardHeader
        title={`${filtered.length} transaction${filtered.length === 1 ? "" : "s"}`}
        description="Most recent first."
        action={
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors ${
 filter === f.key
                    ? "bg-result text-white"
                    : "bg-paper text-ink-soft hover:bg-paper"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      />
      <CardBody className="!p-0">
        {filtered.length === 0 ? (
          <div className="px-5 py-8">
            <EmptyState
              title="No transactions match"
              description={
                filter === "all"
                  ? "Once the league starts churning the waiver wire, the activity will show up here."
                  : `No ${filter} transactions yet. Try a different filter.`
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-rule">
            {filtered.map((t) => (
              <li key={t.transactionKey} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${typeBadge(
 t.type
                    )}`}
                  >
                    {titleCase(t.type.replace("/", " / "))}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {formatTimestamp(t.timestamp)}
                  </span>
                  {t.status && (
                    <span className="text-[11px] uppercase tracking-wide text-ink-muted">
                      {t.status}
                    </span>
                  )}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {t.players.map((p) => (
                    <li
                      key={`${p.playerKey}:${p.transactionType}`}
                      className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm"
                    >
                      <span
                        className={`font-mono text-[10px] uppercase ${
 p.transactionType === "add"
                            ? "text-money"
                            : "text-result"
                        }`}
                      >
                        {p.transactionType.toUpperCase()}
                      </span>
                      <span className="font-medium text-ink">
                        {p.playerName}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {p.position} · {p.nflTeam}
                      </span>
                      {p.transactionType === "add" &&
                        p.destinationTeamName && (
                          <span className="text-xs text-ink-muted">
                            → {p.destinationTeamName}
                          </span>
                        )}
                      {p.transactionType === "drop" && p.sourceTeamName && (
                        <span className="text-xs text-ink-muted">
                          ← {p.sourceTeamName}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
