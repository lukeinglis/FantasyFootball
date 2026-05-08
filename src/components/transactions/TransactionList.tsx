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
      return "bg-violet-500/20 text-violet-200 border-violet-500/30";
    case "add":
      return "bg-emerald-500/20 text-emerald-200 border-emerald-500/30";
    case "drop":
      return "bg-rose-500/20 text-rose-200 border-rose-500/30";
    case "add/drop":
      return "bg-sky-500/20 text-sky-200 border-sky-500/30";
    default:
      return "bg-white/10 text-gray-200 border-white/20";
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
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors ${
                  filter === f.key
                    ? "bg-[#DD550C] text-[#0C2340]"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
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
              icon={<span>🔁</span>}
              title="No transactions match"
              description={
                filter === "all"
                  ? "Once the league starts churning the waiver wire, the activity will show up here."
                  : `No ${filter} transactions yet. Try a different filter.`
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {filtered.map((t) => (
              <li key={t.transactionKey} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${typeBadge(
                      t.type
                    )}`}
                  >
                    {titleCase(t.type.replace("/", " / "))}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(t.timestamp)}
                  </span>
                  {t.status && (
                    <span className="text-[11px] uppercase tracking-wide text-gray-500">
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
                            ? "text-emerald-300"
                            : "text-rose-300"
                        }`}
                      >
                        {p.transactionType.toUpperCase()}
                      </span>
                      <span className="font-medium text-white">
                        {p.playerName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {p.position} · {p.nflTeam}
                      </span>
                      {p.transactionType === "add" &&
                        p.destinationTeamName && (
                          <span className="text-xs text-gray-400">
                            → {p.destinationTeamName}
                          </span>
                        )}
                      {p.transactionType === "drop" && p.sourceTeamName && (
                        <span className="text-xs text-gray-400">
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
