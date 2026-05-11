"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/Card";

interface DraftPick {
  pick: number;
  round: number;
  teamKey: string;
  teamName: string;
  managerName: string;
  playerKey: string;
  playerName: string;
  position: string;
  nflTeam: string;
  isKeeper?: boolean;
  keeperCost?: number | null;
}

interface SeasonDraft {
  year: number;
  picks: DraftPick[];
  teams: { teamKey: string; teamName: string; managerName: string }[];
}

const POSITION_COLORS: Record<string, string> = {
  QB: "bg-rose-500/20 text-rose-200 border-rose-500/30",
  RB: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
  WR: "bg-sky-500/20 text-sky-200 border-sky-200/30",
  TE: "bg-amber-500/20 text-amber-200 border-amber-500/30",
  K: "bg-violet-500/20 text-violet-200 border-violet-500/30",
  DEF: "bg-slate-500/20 text-slate-200 border-slate-500/30",
};

interface Props {
  years: number[];
  drafts: SeasonDraft[];
}

export default function DraftHistoryClient({ years, drafts }: Props) {
  const [selectedYear, setSelectedYear] = useState(years[0] || 2025);
  const [filterPos, setFilterPos] = useState<string>("ALL");
  const [filterKeepers, setFilterKeepers] = useState<"ALL" | "KEEPERS" | "FRESH">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const draft = drafts.find((d) => d.year === selectedYear);
  if (!draft) return null;

  const positions = ["ALL", "QB", "RB", "WR", "TE", "K", "DEF"];
  const keeperCount = draft.picks.filter((p) => p.isKeeper).length;
  const freshCount = draft.picks.length - keeperCount;

  // Build draft board
  const round1 = draft.picks.filter((p) => p.round === 1).sort((a, b) => a.pick - b.pick);
  const teamOrder = round1.map((p) => ({
    teamKey: p.teamKey,
    teamName: p.teamName,
    managerName: p.managerName,
  }));
  const totalRounds = Math.max(...draft.picks.map((p) => p.round), 1);

  const pickByCell = new Map<string, DraftPick>();
  for (const p of draft.picks) {
    pickByCell.set(`${p.round}:${p.teamKey}`, p);
  }

  // Filter picks
  const filteredPicks = draft.picks.filter((p) => {
    if (filterPos !== "ALL" && p.position !== filterPos) return false;
    if (filterKeepers === "KEEPERS" && !p.isKeeper) return false;
    if (filterKeepers === "FRESH" && p.isKeeper) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.playerName.toLowerCase().includes(q) ||
        p.managerName.toLowerCase().includes(q) ||
        p.teamName.toLowerCase().includes(q) ||
        p.nflTeam.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const isFiltering = searchQuery || filterPos !== "ALL" || filterKeepers !== "ALL";

  return (
    <div>
      <Card className="overflow-hidden">
        <CardHeader
          title={`${selectedYear} Draft Board`}
          description={`${draft.picks.length} picks, ${totalRounds} rounds, ${teamOrder.length} teams${keeperCount > 0 ? ` · ${keeperCount} keepers` : ""}`}
        />

        <div className="border-b border-white/10 px-5 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Year tabs */}
            <div className="flex flex-wrap gap-1.5">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-[family-name:var(--font-heading)] font-bold uppercase transition-all ${
                    year === selectedYear
                      ? "bg-[#DD550C] text-white shadow-md shadow-[#DD550C]/20"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>

            {/* Position + Keeper filters */}
            <div className="flex gap-1 ml-auto">
              {positions.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setFilterPos(pos)}
                  className={`rounded px-2 py-1 text-[10px] font-bold uppercase transition-all ${
                    pos === filterPos
                      ? "bg-[#DD550C]/20 text-[#DD550C] border border-[#DD550C]/40"
                      : "bg-white/5 text-gray-500 hover:text-gray-300 border border-transparent"
                  }`}
                >
                  {pos}
                </button>
              ))}
              <span className="mx-1 text-white/20">|</span>
              {(["ALL", "KEEPERS", "FRESH"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterKeepers(f)}
                  className={`rounded px-2 py-1 text-[10px] font-bold uppercase transition-all ${
                    f === filterKeepers
                      ? f === "KEEPERS"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-[#DD550C]/20 text-[#DD550C] border border-[#DD550C]/40"
                      : "bg-white/5 text-gray-500 hover:text-gray-300 border border-transparent"
                  }`}
                >
                  {f === "ALL" ? "All" : f === "KEEPERS" ? `K (${keeperCount})` : `New (${freshCount})`}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <input
              type="text"
              placeholder="Search players, managers, or teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0C2340] px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-[#DD550C]/40 focus:outline-none"
            />
          </div>
        </div>

        {/* Draft Board Grid */}
        {!isFiltering ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0C2340] text-[10px] uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="sticky left-0 z-10 bg-[#0C2340] px-2 py-2">Rd</th>
                  {teamOrder.map((t) => (
                    <th key={t.teamKey} className="px-2 py-2 min-w-[110px] text-left">
                      <p className="truncate font-semibold text-white">{t.managerName}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {Array.from({ length: totalRounds }, (_, r) => r + 1).map((round) => (
                  <tr key={round} className="bg-[#112d4e]/40 hover:bg-[#112d4e]">
                    <td className="sticky left-0 z-10 bg-[#0C2340] px-2 py-2 font-mono text-[#DD550C] font-bold">
                      R{round}
                    </td>
                    {teamOrder.map((t) => {
                      const p = pickByCell.get(`${round}:${t.teamKey}`);
                      if (!p) return <td key={t.teamKey} className="px-2 py-2 text-gray-600">-</td>;
                      const posClass = POSITION_COLORS[p.position] || "bg-white/10 text-gray-200 border-white/20";
                      return (
                        <td key={t.teamKey} className={`px-2 py-2 align-top ${p.isKeeper ? "bg-amber-500/5 border-l-2 border-l-amber-500/40" : ""}`}>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[10px] text-gray-500">#{p.pick}</span>
                            <span className={`rounded-full border px-1.5 py-0 text-[9px] font-bold ${posClass}`}>
                              {p.position}
                            </span>
                            {p.isKeeper && (
                              <span className="rounded bg-amber-500/20 px-1 py-0 text-[8px] font-bold text-amber-300">K</span>
                            )}
                          </div>
                          <p className="mt-0.5 font-medium text-white leading-tight text-[11px]">{p.playerName}</p>
                          <p className="text-[10px] text-gray-500">{p.nflTeam}</p>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Filtered/Search Results */
          <div className="max-h-[600px] overflow-y-auto divide-y divide-white/5">
            {filteredPicks.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                No picks match your filters.
              </div>
            ) : (
              filteredPicks.map((p) => {
                const posClass = POSITION_COLORS[p.position] || "bg-white/10 text-gray-200 border-white/20";
                return (
                  <div key={`${p.pick}-${p.playerKey}`} className={`flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 transition-colors ${p.isKeeper ? "border-l-2 border-l-amber-500/40" : ""}`}>
                    <span className="font-mono text-xs text-gray-500 w-8 text-right">#{p.pick}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${posClass}`}>
                      {p.position}
                    </span>
                    {p.isKeeper && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">KEEPER</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{p.playerName}</p>
                      <p className="text-xs text-gray-400">{p.nflTeam} · R{p.round}</p>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <p>{p.managerName}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Legend */}
        {keeperCount > 0 && !isFiltering && (
          <div className="border-t border-white/10 bg-[#0C2340]/60 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="rounded bg-amber-500/20 px-1 py-0 text-[8px] font-bold text-amber-300">K</span>
              Keeper from previous season ({keeperCount} total)
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}
