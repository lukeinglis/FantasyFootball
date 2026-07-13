"use client";

import { useCallback } from "react";

export interface Tab {
  id: string;
  label: string;
}

interface TabNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function TabNav({ tabs, activeTab, onTabChange }: TabNavProps) {
  const handleClick = useCallback(
    (id: string) => {
      onTabChange(id);
    },
    [onTabChange],
  );

  return (
    <div className="overflow-x-auto scrollbar-hide border-b-2 border-[#D4A847]/30 bg-gradient-to-b from-[#2C1810] to-[#1A0F08]">
      <nav className="flex min-w-max" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleClick(tab.id)}
              className={`relative px-5 py-3 font-[family-name:var(--font-heading)] text-sm uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive
                  ? "text-[#FFD23F] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-[#FFD23F] after:rounded-t"
                  : "text-[#F5F0E8]/50 hover:text-[#F5F0E8] hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
