"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const BreakawayGame = dynamic(() => import("@/components/BreakawayGame"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center">
      <div className="h-[400px] w-full max-w-[400px] animate-pulse rounded-xl bg-white/5" />
    </div>
  ),
});

const FieldGoalGame = dynamic(() => import("@/components/FieldGoalGame"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center">
      <div className="h-[400px] w-full max-w-[500px] animate-pulse rounded-xl bg-white/5" />
    </div>
  ),
});

type GameTab = "breakaway" | "fieldgoal";

export default function GameZone() {
  const [activeTab, setActiveTab] = useState<GameTab>("breakaway");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#183558] to-[#0a1c30] p-6 sm:p-8">
      <div
        className="stripe-pattern pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
      />
      <div className="relative">
        {/* Header */}
        <div className="mb-6 text-center">
          <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.3em] text-[#DD550C]">
            Game Zone
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
            Mini Games
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
            Play for glory. Sign in to save your score to the leaderboard.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setActiveTab("breakaway")}
              className={`rounded-md px-4 py-2 font-[family-name:var(--font-heading)] text-sm font-bold uppercase tracking-wide transition-all ${
                activeTab === "breakaway"
                  ? "bg-[#DD550C] text-white shadow-lg shadow-[#DD550C]/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Breakaway
            </button>
            <button
              onClick={() => setActiveTab("fieldgoal")}
              className={`rounded-md px-4 py-2 font-[family-name:var(--font-heading)] text-sm font-bold uppercase tracking-wide transition-all ${
                activeTab === "fieldgoal"
                  ? "bg-[#DD550C] text-white shadow-lg shadow-[#DD550C]/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Field Goal Frenzy
            </button>
          </div>
        </div>

        {/* Game content */}
        <div>
          {activeTab === "breakaway" && <BreakawayGame />}
          {activeTab === "fieldgoal" && <FieldGoalGame />}
        </div>
      </div>
    </div>
  );
}
