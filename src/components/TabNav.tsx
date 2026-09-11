"use client";

import { useCallback } from "react";

export interface Tab {
  id: string;
  label: string;
  description?: string;
}

interface TabNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

/**
 * Tabs read as a row of section labels under a rule, matching the primary nav
 * so the site has one idea of what "you are here" looks like: a red underscore.
 */
export default function TabNav({ tabs, activeTab, onTabChange }: TabNavProps) {
  const handleClick = useCallback(
    (id: string) => {
      onTabChange(id);
    },
    [onTabChange],
  );

  return (
    <div className="overflow-x-auto border-b border-ink bg-surface">
      <nav className="flex min-w-max" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              title={tab.description}
              onClick={() => handleClick(tab.id)}
              className={`-mb-px min-h-[44px] whitespace-nowrap border-b-2 px-4 font-[family-name:var(--wire-display)] text-[14px] font-bold uppercase tracking-[0.05em] transition-colors ${
                isActive
                  ? "border-result text-ink"
                  : "border-transparent text-ink-muted hover:text-ink"
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
